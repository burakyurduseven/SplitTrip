package com.splittrip.common.api;

import java.net.URI;
import java.util.LinkedHashMap;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.splittrip.auth.application.EmailAlreadyInUseException;
import com.splittrip.auth.application.InvalidCredentialsException;
import com.splittrip.auth.application.InvalidRefreshTokenException;
import com.splittrip.trip.application.InvalidTripDateRangeException;
import com.splittrip.trip.application.TripNotFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(TripNotFoundException.class)
    ResponseEntity<ProblemDetail> handleTripNotFound(
            TripNotFoundException exception,
            HttpServletRequest request) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problem.setTitle("Trip not found");
        problem.setType(URI.create("https://splittrip.app/problems/trip-not-found"));
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    @ExceptionHandler(InvalidTripDateRangeException.class)
    ResponseEntity<ProblemDetail> handleInvalidTripDateRange(
            InvalidTripDateRangeException exception,
            HttpServletRequest request) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        problem.setTitle("Invalid trip date range");
        problem.setType(URI.create("https://splittrip.app/problems/invalid-trip-date-range"));
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler({InvalidCredentialsException.class, InvalidRefreshTokenException.class})
    ResponseEntity<ProblemDetail> handleUnauthorized(
            RuntimeException exception,
            HttpServletRequest request) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, exception.getMessage());
        problem.setTitle("Authentication failed");
        problem.setType(URI.create("https://splittrip.app/problems/authentication-failed"));
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
    }

    @ExceptionHandler(EmailAlreadyInUseException.class)
    ResponseEntity<ProblemDetail> handleEmailAlreadyInUse(
            EmailAlreadyInUseException exception,
            HttpServletRequest request) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
        problem.setTitle("Email already in use");
        problem.setType(URI.create("https://splittrip.app/problems/email-already-in-use"));
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ProblemDetail> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {
        var errors = new LinkedHashMap<String, String>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                errors.putIfAbsent(error.getField(), error.getDefaultMessage()));

        var problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "One or more request fields are invalid.");
        problem.setTitle("Validation failed");
        problem.setType(URI.create("https://splittrip.app/problems/validation-failed"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(problem);
    }
}
