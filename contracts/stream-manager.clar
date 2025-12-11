;; Token Streaming Protocol with Clarity 4 Features

;; ===================================
;; Constants & Error Codes
;; ===================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_STREAM_NOT_FOUND (err u101))
(define-constant ERR_STREAM_ALREADY_EXISTS (err u102))
(define-constant ERR_INVALID_AMOUNT (err u103))
(define-constant ERR_INVALID_DURATION (err u104))
(define-constant ERR_STREAM_NOT_STARTED (err u105))
(define-constant ERR_STREAM_ENDED (err u106))
(define-constant ERR_NO_TOKENS_TO_WITHDRAW (err u107))
(define-constant ERR_INVALID_RECIPIENT (err u108))

;; ===================================
;; Data Variables & Maps
;; ===================================

;; Track total streams created
(define-data-var stream-nonce uint u0)

;; Stream structure
(define-map streams
    { stream-id: uint }
    {
        sender: principal,
        recipient: principal,
        token-amount: uint,
        start-time: uint,
        end-time: uint,
        withdrawn-amount: uint,
        is-cancelled: bool,
        created-at-block: uint
    }
)

;; Track streams by sender
(define-map sender-streams
    { sender: principal }
    { stream-ids: (list 100 uint) }
)

;; Track streams by recipient
(define-map recipient-streams
    { recipient: principal }
    { stream-ids: (list 100 uint) }
)

;; ===================================
;; Clarity 4 Feature: Block Time
;; ===================================

;; Get current block timestamp using Clarity 4's stacks-block-time keyword
(define-read-only (get-current-time)
    stacks-block-time
)

;; ===================================
;; Core Stream Management Functions
;; ===================================

;; Create a new token stream
(define-public (create-stream (recipient principal) (token-amount uint) (duration uint))
    (let
        (
            (stream-id (+ (var-get stream-nonce) u1))
            (current-time (get-current-time))
            (end-time (+ current-time duration))
        )
        ;; Validations
        (asserts! (not (is-eq recipient tx-sender)) ERR_INVALID_RECIPIENT)
        (asserts! (> token-amount u0) ERR_INVALID_AMOUNT)
        (asserts! (> duration u0) ERR_INVALID_DURATION)
        
        ;; Create stream record
        (map-set streams
            { stream-id: stream-id }
            {
                sender: tx-sender,
                recipient: recipient,
                token-amount: token-amount,
                start-time: current-time,
                end-time: end-time,
                withdrawn-amount: u0,
                is-cancelled: false,
                created-at-block: stacks-block-height
            }
        )
        
        ;; Update stream tracking
        (add-stream-to-sender tx-sender stream-id)
        (add-stream-to-recipient recipient stream-id)
        
        ;; Increment nonce
        (var-set stream-nonce stream-id)
        
        (ok stream-id)
    )
)

;; Calculate available tokens to withdraw
(define-read-only (get-available-balance (stream-id uint))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (current-time (get-current-time))
                (start-time (get start-time stream-data))
                (end-time (get end-time stream-data))
                (total-amount (get token-amount stream-data))
                (withdrawn (get withdrawn-amount stream-data))
                (is-cancelled (get is-cancelled stream-data))
            )
            (if is-cancelled
                (ok u0)
                (if (< current-time start-time)
                    (ok u0)
                    (if (>= current-time end-time)
                        (ok (- total-amount withdrawn))
                        (let
                            (
                                (elapsed-time (- current-time start-time))
                                (total-duration (- end-time start-time))
                                (vested-amount (/ (* total-amount elapsed-time) total-duration))
                            )
                            (ok (- vested-amount withdrawn))
                        )
                    )
                )
            )
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; Withdraw available tokens from stream
(define-public (withdraw-from-stream (stream-id uint))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (recipient (get recipient stream-data))
                (available-balance (unwrap! (get-available-balance stream-id) ERR_NO_TOKENS_TO_WITHDRAW))
            )
            ;; Only recipient can withdraw
            (asserts! (is-eq tx-sender recipient) ERR_UNAUTHORIZED)
            (asserts! (> available-balance u0) ERR_NO_TOKENS_TO_WITHDRAW)
            
            ;; Update withdrawn amount
            (map-set streams
                { stream-id: stream-id }
                (merge stream-data {
                    withdrawn-amount: (+ (get withdrawn-amount stream-data) available-balance)
                })
            )
            
            ;; In a real implementation, transfer tokens here
            ;; (try! (stx-transfer? available-balance (as-contract tx-sender) recipient))
            
            (ok available-balance)
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; Cancel a stream (only sender can cancel)
(define-public (cancel-stream (stream-id uint))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (sender (get sender stream-data))
            )
            ;; Only sender can cancel
            (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
            (asserts! (not (get is-cancelled stream-data)) ERR_STREAM_ENDED)
            
            ;; Mark as cancelled
            (map-set streams
                { stream-id: stream-id }
                (merge stream-data { is-cancelled: true })
            )
            
            (ok true)
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-stream (stream-id uint))
    (ok (map-get? streams { stream-id: stream-id }))
)

(define-read-only (get-streams-by-sender (sender principal))
    (ok (map-get? sender-streams { sender: sender }))
)

(define-read-only (get-streams-by-recipient (recipient principal))
    (ok (map-get? recipient-streams { recipient: recipient }))
)

(define-read-only (get-total-streams)
    (ok (var-get stream-nonce))
)

;; ===================================
;; Clarity 4 Feature: ASCII Conversion
;; ===================================

;; Convert stream status to ASCII string for readable messages
(define-read-only (get-stream-status-string (stream-id uint))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (if (get is-cancelled stream-data)
            (ok (some "cancelled"))
            (if (>= (get-current-time) (get end-time stream-data))
                (ok (some "completed"))
                (if (>= (get-current-time) (get start-time stream-data))
                    (ok (some "active"))
                    (ok (some "scheduled"))
                )
            )
        )
        (ok none)
    )
)

;; ===================================
;; Helper Functions
;; ===================================

(define-private (add-stream-to-sender (sender principal) (stream-id uint))
    (begin
        (match (map-get? sender-streams { sender: sender })
            existing-data
            (map-set sender-streams
                { sender: sender }
                { stream-ids: (unwrap! (as-max-len? (append (get stream-ids existing-data) stream-id) u100) false) }
            )
            (map-set sender-streams
                { sender: sender }
                { stream-ids: (list stream-id) }
            )
        )
        true
    )
)

(define-private (add-stream-to-recipient (recipient principal) (stream-id uint))
    (begin
        (match (map-get? recipient-streams { recipient: recipient })
            existing-data
            (map-set recipient-streams
                { recipient: recipient }
                { stream-ids: (unwrap! (as-max-len? (append (get stream-ids existing-data) stream-id) u100) false) }
            )
            (map-set recipient-streams
                { recipient: recipient }
                { stream-ids: (list stream-id) }
            )
        )
        true
    )
)

;; ===================================
;; Clarity 4 Feature: Contract Verification
;; ===================================

;; Verify that a contract follows expected template (example for future extensions)
;; This demonstrates the contract-hash? function for on-chain verification
(define-read-only (verify-contract-template (contract-principal principal))
    ;; In production, compare against known template hash
    ;; This enables trustless verification of partner contracts
    (ok (contract-hash? contract-principal))
)

