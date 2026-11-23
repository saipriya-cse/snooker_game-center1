
from django.contrib import admin
from .models import Table, Booking


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):

    list_display = (
        "table_number",
        "name",
        "price_per_hour",
        "is_available"
    )

    list_filter = ("is_available",)

    search_fields = ("name",)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "customer",
        "user",
        "table",
        "booking_date",
        "start_time",
        "duration_minutes",
        "amount",
        "status"
    )

    list_filter = (
        "status",
        "booking_date"
    )

    search_fields = (
        "customer",
        "user__username"
    )
