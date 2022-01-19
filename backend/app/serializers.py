"""
Serializers take models or other data structures and present them
in ways that can be transported across the backend/frontend divide, or
allow the frontend to suggest changes to the backend/database.
"""
from .models import Person

class PersonSerializer:

    class Meta:
        model = Person
        fields = ['id','first_name','last_name','ethnicity','date_of_birth','country_of_origin']
