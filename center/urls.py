from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),

    path("register/", views.register, name="register"),

    path(
        "verify-email/<str:token>/",
        views.verify_email,
        name="verify_email"
    ),

    path("login/", views.user_login, name="login"),

    path("logout/", views.user_logout, name="logout"),

    path("booking/", views.book_table, name="book_table"),

    path("tables/", views.book_table, name="tables"),

    path(
        "my-bookings/",
        views.my_bookings,
        name="my_bookings"
    ),

    path("game/", views.game, name="game"),
]