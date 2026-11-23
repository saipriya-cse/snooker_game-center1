
from django.db import models
from django.contrib.auth.models import User


class Table(models.Model):
    table_number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=100)

    price_per_hour = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=200
    )

    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"Table {self.table_number}"


class Booking(models.Model):

    STATUS_CHOICES = [
        ("Confirmed", "Confirmed"),
        ("Cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="snooker_bookings",
        null=True,
        blank=True
    )

    customer = models.CharField(max_length=100)

    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    booking_date = models.DateField()
    start_time = models.TimeField()

    duration_minutes = models.PositiveIntegerField(default=60)

    amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=200
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Confirmed"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer} - {self.table} - {self.booking_date}"
