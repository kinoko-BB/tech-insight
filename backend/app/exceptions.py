class AppException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: list | None = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed", details: list | None = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=422,
            details=details,
        )


class DatabaseError(AppException):
    def __init__(self, message: str = "Database error"):
        super().__init__(code="DATABASE_ERROR", message=message, status_code=500)
