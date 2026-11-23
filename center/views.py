
from datetime import datetime, timedelta

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.utils import timezone
from django.core import signing
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.contrib.auth import login, logout, authenticate

from .models import Table, Booking


VERIFICATION_SALT = "royal-snooker-email-verification"
VERIFICATION_MAX_AGE = 60 * 60 * 24


# ==========================================
# HOME PAGE
# ==========================================

def home(request):
    return render(request, "home.html")


# ==========================================
# SEND EMAIL NOTIFICATION
# ==========================================

def send_notification(subject, message, recipient):

    if not recipient:
        print("EMAIL ERROR: Recipient email is missing.")
        return False

    try:
        result = send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [recipient],
            fail_silently=False
        )

        if result == 1:
            print("EMAIL SENT SUCCESSFULLY TO:", recipient)
            return True

        print("EMAIL WAS NOT SENT TO:", recipient)
        return False

    except Exception as error:
        print("EMAIL ERROR:", repr(error))
        return False


# ==========================================
# USER REGISTRATION
# ==========================================

def register(request):

    if request.method == "POST":

        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        if not username or not email or not password:
            messages.error(
                request,
                "Please fill in all required fields."
            )
            return redirect("register")

        if password != confirm_password:
            messages.error(
                request,
                "Passwords do not match."
            )
            return redirect("register")

        if User.objects.filter(username=username).exists():
            messages.error(
                request,
                "Username already exists."
            )
            return redirect("register")

        if User.objects.filter(email__iexact=email).exists():
            messages.error(
                request,
                "Email already registered."
            )
            return redirect("register")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=False
        )

        token = signing.dumps(
            {"user_id": user.id},
            salt=VERIFICATION_SALT
        )

        verification_url = request.build_absolute_uri(
            reverse("verify_email", args=[token])
        )

        email_sent = send_notification(
            "Royal Snooker - Verify Your Email",
            (
                f"Hello {username},\n\n"
                "Please verify your email using this link:\n"
                f"{verification_url}\n\n"
                "This link expires in 24 hours."
            ),
            email
        )

        if email_sent:
            return render(
                request,
                "verification_sent.html"
            )

        user.delete()

        messages.error(
            request,
            "Verification email could not be sent. Please try again."
        )

        return redirect("register")

    return render(request, "register.html")


# ==========================================
# VERIFY EMAIL
# ==========================================

def verify_email(request, token):

    try:

        data = signing.loads(
            token,
            salt=VERIFICATION_SALT,
            max_age=VERIFICATION_MAX_AGE
        )

        user = User.objects.get(
            id=data["user_id"]
        )

        user.is_active = True
        user.save()

        return render(
            request,
            "verification_success.html"
        )

    except (
        signing.BadSignature,
        signing.SignatureExpired,
        User.DoesNotExist,
        KeyError
    ):

        return render(
            request,
            "verification_failed.html"
        )


# ==========================================
# USER LOGIN
# ==========================================

def user_login(request):

    if request.method == "POST":

        username_or_email = request.POST.get(
            "username",
            ""
        ).strip()

        password = request.POST.get(
            "password",
            ""
        )

        user = authenticate(
            request,
            username=username_or_email,
            password=password
        )

        if user is None:

            try:

                account = User.objects.get(
                    email__iexact=username_or_email
                )

                user = authenticate(
                    request,
                    username=account.username,
                    password=password
                )

            except User.DoesNotExist:
                user = None

        if user is not None:

            if not user.is_active:

                messages.error(
                    request,
                    "Please verify your email before logging in."
                )

                return redirect("login")

            login(request, user)

            return redirect("home")

        messages.error(
            request,
            "Invalid username/email or password."
        )

    return render(
        request,
        "login.html"
    )


# ==========================================
# USER LOGOUT
# ==========================================

@login_required
def user_logout(request):

    logout(request)

    return redirect("home")


# ==========================================
# SEND BOOKING CONFIRMATION EMAIL
# ==========================================

def send_booking_confirmation(booking):

    # BOOKING DETAILS

    booking_details = (
        f"Booking ID: {booking.id}\n"
        f"Customer: {booking.customer}\n"
        f"Table: {booking.table}\n"
        f"Date: {booking.booking_date}\n"
        f"Start Time: {booking.start_time}\n"
        f"Duration: {booking.duration_minutes} minutes\n"
        f"Amount: Rs. {booking.amount}\n"
        f"Status: {booking.status}\n"
    )

    # CUSTOMER EMAIL

    user_email = (
        booking.user.email
        if booking.user
        else ""
    )

    if user_email:

        send_notification(
            "Royal Snooker - Booking Confirmation",
            (
                f"Hello {booking.customer},\n\n"
                "Your booking has been confirmed!\n\n"
                f"{booking_details}\n"
                "Thank you for choosing Royal Snooker Arena."
            ),
            user_email
        )

    else:

        print("CUSTOMER EMAIL ADDRESS IS MISSING!")

    # OWNER EMAIL

    owner_email = getattr(
        settings,
        "ARENA_OWNER_EMAIL",
        ""
    ).strip()

    if owner_email:

        send_notification(
            "Royal Snooker - New Booking Received",
            (
                "Hello Owner,\n\n"
                "A new booking has been received!\n\n"
                f"{booking_details}\n"
                "Please check the booking in your admin panel."
            ),
            owner_email
        )

    else:

        print("OWNER EMAIL ADDRESS IS MISSING!")


# ==========================================
# BOOK A TABLE
# ==========================================

@login_required
def book_table(request):

    tables = Table.objects.all().order_by(
        "table_number"
    )

    if request.method == "POST":

        customer_name = request.POST.get(
            "customer_name",
            ""
        ).strip()

        table_id = request.POST.get("table")
        booking_date = request.POST.get("booking_date")
        start_time = request.POST.get("start_time")
        duration = request.POST.get("duration")

        if not all([
            customer_name,
            table_id,
            booking_date,
            start_time,
            duration
        ]):

            messages.error(
                request,
                "Please fill in all booking details."
            )

            return render(
                request,
                "book_table.html",
                {"tables": tables}
            )

        try:

            table = Table.objects.get(
                id=table_id,
                is_available=True
            )

            booking_day = datetime.strptime(
                booking_date,
                "%Y-%m-%d"
            ).date()

            start = datetime.strptime(
                start_time,
                "%H:%M"
            ).time()

            duration_minutes = int(duration)

            if duration_minutes not in [
                60,
                120,
                180,
                240
            ]:

                raise ValueError("Invalid duration")

            if booking_day < timezone.localdate():

                messages.error(
                    request,
                    "Please select a valid booking date."
                )

                return render(
                    request,
                    "book_table.html",
                    {"tables": tables}
                )

            start_dt = datetime.combine(
                booking_day,
                start
            )

            end_dt = start_dt + timedelta(
                minutes=duration_minutes
            )

            if booking_day == timezone.localdate():

                current_time = timezone.localtime().replace(
                    tzinfo=None
                )

                if start_dt <= current_time:

                    messages.error(
                        request,
                        "Please select a future starting time."
                    )

                    return render(
                        request,
                        "book_table.html",
                        {"tables": tables}
                    )

            # CHECK EXISTING BOOKINGS

            existing_bookings = Booking.objects.filter(
                table=table,
                booking_date=booking_day,
                status="Confirmed"
            )

            for existing in existing_bookings:

                old_start = datetime.combine(
                    existing.booking_date,
                    existing.start_time
                )

                old_end = old_start + timedelta(
                    minutes=existing.duration_minutes
                )

                if start_dt < old_end and end_dt > old_start:

                    messages.error(
                        request,
                        "This table is already booked for that time."
                    )

                    return render(
                        request,
                        "book_table.html",
                        {"tables": tables}
                    )

            # CALCULATE AMOUNT

            amount = (
                table.price_per_hour * duration_minutes / 60
            )

            # CREATE BOOKING

            booking = Booking.objects.create(
                user=request.user,
                customer=customer_name,
                table=table,
                booking_date=booking_day,
                start_time=start,
                duration_minutes=duration_minutes,
                amount=amount,
                status="Confirmed"
            )

            print("NEW BOOKING CREATED:", booking.id)

            # SEND EMAILS

            send_booking_confirmation(booking)

            messages.success(
                request,
                "Your booking has been confirmed!"
            )

            return redirect("game")

        except Table.DoesNotExist:

            messages.error(
                request,
                "Selected table is unavailable."
            )

        except (ValueError, TypeError):

            messages.error(
                request,
                "Please enter valid booking details."
            )

        except Exception as error:

            print("BOOKING ERROR:", repr(error))

            messages.error(
                request,
                "Something went wrong while creating your booking."
            )

    return render(
        request,
        "book_table.html",
        {"tables": tables}
    )


# ==========================================
# MY BOOKINGS
# ==========================================

@login_required
def my_bookings(request):

    bookings = Booking.objects.filter(
        user=request.user
    ).select_related(
        "table"
    ).order_by(
        "-booking_date",
        "-start_time"
    )

    return render(
        request,
        "my_bookings.html",
        {"bookings": bookings}
    )


# ==========================================
# GAME PAGE
# ==========================================

@login_required
def game(request):

    return render(
        request,
        "game.html"
    )
