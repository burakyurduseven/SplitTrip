package com.splittrip.trip.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.splittrip.trip.application.ExpenseService;
import com.splittrip.trip.application.ExpenseAttachmentService;
import com.splittrip.trip.application.ExpenseAttachmentService.AttachmentView;
import com.splittrip.trip.application.ExpenseService.*;
import com.splittrip.trip.domain.ExpenseSplitMethod;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.InputStreamResource;

@RestController
@RequestMapping("/api/v1/trips/{tripId}/expenses")
public class ExpenseController {
    private final ExpenseService service;
    private final ExpenseAttachmentService attachmentService;
    public ExpenseController(ExpenseService service, ExpenseAttachmentService attachmentService) { this.service = service; this.attachmentService = attachmentService; }
    @GetMapping @Operation(summary = "List trip expenses") List<ExpenseView> list(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) { return service.list(tripId, userId(jwt)); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @Operation(summary = "Create a shared expense") ExpenseView create(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @Valid @RequestBody ExpenseRequest request) { return service.create(tripId, userId(jwt), request.toInput()); }
    @PutMapping("/{expenseId}") @Operation(summary = "Update a shared expense") ExpenseView update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID expenseId, @Valid @RequestBody ExpenseRequest request) { return service.update(tripId, expenseId, userId(jwt), request.toInput()); }
    @DeleteMapping("/{expenseId}") @ResponseStatus(HttpStatus.NO_CONTENT) @Operation(summary = "Delete a shared expense") void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID expenseId) { service.delete(tripId, expenseId, userId(jwt)); }
    @PostMapping(value = "/{expenseId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED) @Operation(summary = "Upload receipt or invoice documents")
    List<AttachmentView> uploadAttachments(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId,
            @PathVariable UUID expenseId, @RequestPart("files") List<MultipartFile> files) {
        return attachmentService.upload(tripId, expenseId, userId(jwt), files);
    }
    @GetMapping("/{expenseId}/attachments/{attachmentId}/content")
    @Operation(summary = "View or download a receipt or invoice")
    ResponseEntity<InputStreamResource> attachmentContent(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId,
            @PathVariable UUID expenseId, @PathVariable UUID attachmentId,
            @RequestParam(defaultValue = "false") boolean download) {
        var file = attachmentService.download(tripId, expenseId, attachmentId, userId(jwt));
        var disposition = ContentDisposition.builder(download ? "attachment" : "inline").filename(file.originalName(), java.nio.charset.StandardCharsets.UTF_8).build();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType())).contentLength(file.size())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString()).body(new InputStreamResource(file.content()));
    }
    @DeleteMapping("/{expenseId}/attachments/{attachmentId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a receipt or invoice")
    void deleteAttachment(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID expenseId,
            @PathVariable UUID attachmentId) { attachmentService.delete(tripId, expenseId, attachmentId, userId(jwt)); }
    private UUID userId(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
    public record ParticipantRequest(@NotNull UUID userId, @DecimalMin("0.01") BigDecimal amount, @DecimalMin("0.01") @DecimalMax("100") BigDecimal percentage) { ParticipantInput toInput() { return new ParticipantInput(userId, amount, percentage); } }
    public record ExpenseRequest(@NotBlank @Size(max=120) String title, @NotNull @DecimalMin("0.01") @Digits(integer=17, fraction=2) BigDecimal amount,
            @NotNull LocalDate expenseDate, @NotNull UUID paidById, @NotNull ExpenseSplitMethod splitMethod, @Size(max=500) String note,
            @NotEmpty List<@Valid ParticipantRequest> participants) { ExpenseInput toInput() { return new ExpenseInput(title, amount, expenseDate, paidById, splitMethod, note, participants.stream().map(ParticipantRequest::toInput).toList()); } }
}
