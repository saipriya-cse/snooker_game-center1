
from django.db import models
from django.contrib.auth.models import User


class SnookerTable(models.Model):
    name = models.CharField(max_length=100)
    table_number = models.IntegerField(unique=True)
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=150.00
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - Table {self.table_number}"


class Booking(models.Model):

    DURATION_CHOICES = [
        (30, "30 Minutes"),
        (60, "1 Hour"),
        (120, "2 Hours"),
    ]

    STATUS_CHOICES = [
        ("Booked", "Booked"),
        ("Cancelled", "Cancelled"),
        ("Completed", "Completed"),
    ]

    PAYMENT_CHOICES = [
        ("Pending", "Pending"),
        ("Paid", "Paid"),
    ]

    booking_date = models.DateField()
    start_time = models.TimeField()

    duration_minutes = models.IntegerField(
        choices=DURATION_CHOICES
    )

    amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Booked"
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default="Pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="snooker_bookings"
    )

    table = models.ForeignKey(
        SnookerTable,
        on_delete=models.PROTECT
    )

    def __str__(self):
        return f"{self.customer.username} - {self.booking_date}"
