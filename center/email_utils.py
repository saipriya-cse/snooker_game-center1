from django.conf import settings
from django.core.mail import send_mail


def send_booking_email(booking):

    customer = booking.customer

    customer_email = customer.email

    subject = "Game Arena - Snooker Booking Confirmation"

    message = f"""
Hello {customer.username},

Thank you for choosing Game Arena!

Your snooker table booking has been received successfully.

BOOKING DETAILS
--------------------------------

Customer Name: {customer.username}

Customer Email: {customer_email}

Game: Snooker

Table: {booking.table}

Booking Date: {booking.booking_date}

Start Time: {booking.start_time}

Duration: {booking.duration_minutes} minutes

Amount: Rs. {booking.amount}

--------------------------------

Thank you for booking with Game Arena.

We look forward to seeing you!

Regards,
Game Arena Team
"""

    # Send confirmation to customer
    if customer_email:

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [customer_email],
            fail_silently=False
        )

    # Send notification to admin
    admin_message = f"""
NEW SNOOKER BOOKING

Customer: {customer.username}

Customer Email: {customer_email}

Table: {booking.table}

Date: {booking.booking_date}

Time: {booking.start_time}

Duration: {booking.duration_minutes} minutes

Amount: Rs. {booking.amount}
"""

    send_mail(
        "Game Arena - New Booking Alert",
        admin_message,
        settings.DEFAULT_FROM_EMAIL,
        [settings.ADMIN_EMAIL],
        fail_silently=False
    )

    return True