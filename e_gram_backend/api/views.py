# 1. ALL IMPORTS ARE AT THE TOP AND CLEANED UP
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User

from .models import HomeworkPost, Comment
from .serializers import HomeworkPostSerializer, CommentSerializer, UserSerializer
from .permissions import IsAuthorOrReadOnly


# 2. API ROOT VIEW IS AT THE TOP LEVEL (NOT INDENTED)
@api_view(['GET'])
@permission_classes([AllowAny])
def ApiRootView(request):
    """
    A simple welcome message for the API root.
    """
    return Response({
        "message": "Welcome to the E gram API!",
        "endpoints": {
            "auth": "/api/auth/",
            "register": "/api/auth/register/",
            "login": "/api/auth/login/",
            "posts": "/api/posts/",
            "comments": "/api/comments/",
        }
    })


# 3. ALL OTHER VIEWS ARE ALSO AT THE TOP LEVEL
class HomeworkPostViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows homework posts to be viewed or edited.
    - GET /api/posts/: List all posts (anyone)
    - POST /api/posts/: Create a new post (authenticated users only)
    - GET /api/posts/{id}/: Retrieve a single post (anyone)
    - PUT /api/posts/{id}/: Update a post (author only)
    - DELETE /api/posts/{id}/: Delete a post (author only)
    """
    queryset = HomeworkPost.objects.all().order_by('-created_at')
    serializer_class = HomeworkPostSerializer
    permission_classes = [IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for comments.
    - GET /api/comments/: List all comments (authenticated users only)
    - POST /api/comments/: Create a new comment (authenticated users only)
    """
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        # The post ID should be passed in the request body
        post_id = self.request.data.get('post')
        if not post_id:
            return Response({"error": "Post ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            post = HomeworkPost.objects.get(pk=post_id)
        except HomeworkPost.DoesNotExist:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
            
        serializer.save(author=self.request.user, post=post)


class RegisterView(APIView):
    """
    API endpoint for user registration.
    - POST /api/auth/register/: Create a new user.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
