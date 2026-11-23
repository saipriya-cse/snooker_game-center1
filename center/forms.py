
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

from .models import Booking


class RegistrationForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            "placeholder": "Enter your email address"
        })
    )

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError(
                "This email address is already registered."
            )

        return email


class BookingForm(forms.ModelForm):
    class Meta:
        model = Booking
        fields = [
            "customer",
            "table",
            "booking_date",
            "start_time",
            "duration_minutes",
        ]

        widgets = {
            "customer": forms.TextInput(attrs={
                "placeholder": "Enter customer name"
            }),
            "table": forms.Select(),
            "booking_date": forms.DateInput(attrs={
                "type": "date"
            }),
            "start_time": forms.TimeInput(attrs={
                "type": "time"
            }),
            "duration_minutes": forms.Select(
                choices=[
                    (30, "30 Minutes"),
                    (60, "1 Hour"),
                    (90, "1 Hour 30 Minutes"),
                    (120, "2 Hours"),
                    (180, "3 Hours"),
                ]
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["table"].queryset = (
            self.fields["table"].queryset.filter(is_available=True)
        )
