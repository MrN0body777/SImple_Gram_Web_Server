from django.contrib import admin
from django.urls import path, include

from api.views import ApiRootView

urlpatterns = [
    path('', ApiRootView, name='api_root'),
    
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]