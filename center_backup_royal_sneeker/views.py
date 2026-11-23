from django.core import signing
from django.urls import reverse
from django.http import HttpResponse
from decimal import Decimal

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.mail import send_mail

from .forms import RegistrationForm, BookingForm
from .models import Booking


def home(request):

    register_form = RegistrationForm()
    booking_form = BookingForm()

    login_error = ""
    register_error = ""

    if request.method == "POST":

        action = request.POST.get("action")

        # USER REGISTRATION
        if action == "register":

            register_form = RegistrationForm(request.POST)

            if register_form.is_valid():

                user = register_form.save()

                # SEND WELCOME EMAIL
                try:
                    send_mail(
                        subject="Welcome to Snooker Gaming Center!",
                        message=(
                            f"Hello {user.username},\n\n"
                            "Your account has been successfully "
                            "created at Snooker Gaming Center.\n\n"
                            "You can now log in and enjoy playing "
                            "snooker.\n\n"
                            "Thank you for joining us!"
                        ),
                        from_email=None,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )

                    messages.success(
                        request,
                        "Registration successful! Welcome email sent."
                    )

                except Exception:
                    messages.warning(
                        request,
                        "Your account was created, but the welcome "
                        "email could not be sent. Please check email "
                        "configuration."
                    )

                login(request, user)

                return redirect("/#game")

            else:
                register_error = (
                    "Please correct the registration details."
                )

        # USER LOGIN USING USERNAME OR EMAIL
        elif action == "login":

            identifier = request.POST.get(
                "username", ""
            ).strip()

            password = request.POST.get("password", "")

            existing_user = User.objects.filter(
                email__iexact=identifier
            ).first()

            if existing_user:
                username = existing_user.username
            else:
                username = identifier

            user = authenticate(
                request,
                username=username,
                password=password
            )

            if user is not None:

                login(request, user)

                messages.success(
                    request,
                    "Login successful! Enjoy your game."
                )

                return redirect("/#game")

            else:
                login_error = (
                    "Invalid username/email or password."
                )

        # TABLE BOOKING
        elif action == "booking":

            if not request.user.is_authenticated:

                messages.error(
                    request,
                    "Please login before booking."
                )

                return redirect("/#login")

            booking_form = BookingForm(request.POST)

            if booking_form.is_valid():

                booking = booking_form.save(commit=False)

                booking.customer = request.user

                booking.amount = (
                    booking.table.hourly_rate
                    * Decimal(booking.duration_minutes)
                    / Decimal("60")
                )

                booking.save()

                messages.success(
                    request,
                    "Your snooker table has been booked successfully!"
                )

                return redirect("/#booking")

    context = {
        "register_form": register_form,
        "booking_form": booking_form,
        "login_error": login_error,
        "register_error": register_error,
    }

    # SHOW ONLY CURRENT USER'S BOOKINGS
    if request.user.is_authenticated:

        context["my_bookings"] = Booking.objects.filter(
            customer=request.user
        ).order_by("-created_at")

    return render(request, "home.html", context)


# USER LOGOUT
def user_logout(request):

    if request.method == "POST":

        logout(request)

        messages.success(
            request,
            "You have logged out successfully."
        )

    return redirect("/#account")
