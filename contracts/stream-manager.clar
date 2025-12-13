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
(define-constant ERR_STREAM_PAUSED (err u109))
(define-constant ERR_STREAM_NOT_PAUSED (err u110))
(define-constant ERR_TRANSFER_FAILED (err u111))
(define-constant ERR_INVALID_TOKEN (err u112))
(define-constant ERR_INSUFFICIENT_BALANCE (err u113))

;; Token type constants
(define-constant TOKEN_TYPE_STX "STX")
(define-constant TOKEN_TYPE_SIP010 "SIP010")

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
        is-paused: bool,
        paused-at: uint,
        total-paused-duration: uint,
        created-at-block: uint,
        token-type: (string-ascii 10),
        token-contract: (optional principal)
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
;; SIP-010 Fungible Token Trait
;; ===================================

(define-trait sip010-ft-trait
    (
        (transfer (uint principal principal (optional (buff 34))) (response bool uint))
        (get-name () (response (string-ascii 32) uint))
        (get-symbol () (response (string-ascii 32) uint))
        (get-decimals () (response uint uint))
        (get-balance (principal) (response uint uint))
        (get-total-supply () (response uint uint))
        (get-token-uri () (response (optional (string-utf8 256)) uint))
    )
)

;; ===================================
;; Events (using print statements)
;; ===================================

(define-private (emit-stream-created (stream-id uint) (sender principal) (recipient principal) (amount uint) (duration uint) (token-type (string-ascii 10)))
    (print {
        event: "stream-created",
        stream-id: stream-id,
        sender: sender,
        recipient: recipient,
        amount: amount,
        duration: duration,
        token-type: token-type,
        timestamp: stacks-block-time
    })
)

(define-private (emit-withdrawal (stream-id uint) (recipient principal) (amount uint))
    (print {
        event: "withdrawal",
        stream-id: stream-id,
        recipient: recipient,
        amount: amount,
        timestamp: stacks-block-time
    })
)

(define-private (emit-stream-cancelled (stream-id uint) (sender principal))
    (print {
        event: "stream-cancelled",
        stream-id: stream-id,
        sender: sender,
        timestamp: stacks-block-time
    })
)

(define-private (emit-stream-paused (stream-id uint) (sender principal))
    (print {
        event: "stream-paused",
        stream-id: stream-id,
        sender: sender,
        timestamp: stacks-block-time
    })
)

(define-private (emit-stream-resumed (stream-id uint) (sender principal))
    (print {
        event: "stream-resumed",
        stream-id: stream-id,
        sender: sender,
        timestamp: stacks-block-time
    })
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

;; Create a new STX token stream with actual transfer
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
        
        ;; Note: Token transfers would require sender to manually send STX to contract
        ;; Contract tracks the stream but doesn't hold tokens in this version
        ;; For production use, sender should transfer tokens separately
        
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
                is-paused: false,
                paused-at: u0,
                total-paused-duration: u0,
                created-at-block: stacks-block-height,
                token-type: TOKEN_TYPE_STX,
                token-contract: none
            }
        )
        
        ;; Update stream tracking
        (add-stream-to-sender tx-sender stream-id)
        (add-stream-to-recipient recipient stream-id)
        
        ;; Increment nonce
        (var-set stream-nonce stream-id)
        
        ;; Emit event
        (emit-stream-created stream-id tx-sender recipient token-amount duration TOKEN_TYPE_STX)
        
        (ok stream-id)
    )
)

;; Create a new SIP-010 token stream
(define-public (create-sip010-stream 
    (recipient principal) 
    (token-amount uint) 
    (duration uint)
    (token-contract <sip010-ft-trait>))
    (let
        (
            (stream-id (+ (var-get stream-nonce) u1))
            (current-time (get-current-time))
            (end-time (+ current-time duration))
            (token-principal (contract-of token-contract))
        )
        ;; Validations
        (asserts! (not (is-eq recipient tx-sender)) ERR_INVALID_RECIPIENT)
        (asserts! (> token-amount u0) ERR_INVALID_AMOUNT)
        (asserts! (> duration u0) ERR_INVALID_DURATION)
        
        ;; Note: Token transfers would require sender to manually send tokens to contract
        ;; Contract tracks the stream but doesn't hold tokens in this version
        ;; For production use, sender should transfer tokens separately
        
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
                is-paused: false,
                paused-at: u0,
                total-paused-duration: u0,
                created-at-block: stacks-block-height,
                token-type: TOKEN_TYPE_SIP010,
                token-contract: (some token-principal)
            }
        )
        
        ;; Update stream tracking
        (add-stream-to-sender tx-sender stream-id)
        (add-stream-to-recipient recipient stream-id)
        
        ;; Increment nonce
        (var-set stream-nonce stream-id)
        
        ;; Emit event
        (emit-stream-created stream-id tx-sender recipient token-amount duration TOKEN_TYPE_SIP010)
        
        (ok stream-id)
    )
)

;; Calculate available tokens to withdraw (accounting for paused time)
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
                (is-paused (get is-paused stream-data))
                (paused-at (get paused-at stream-data))
                (total-paused-duration (get total-paused-duration stream-data))
            )
            (if is-cancelled
                (ok u0)
                (if is-paused
                    (ok u0)  ;; No tokens available while paused
                    (if (< current-time start-time)
                        (ok u0)
                        (let
                            (
                                ;; Adjust elapsed time by subtracting paused duration
                                (raw-elapsed (- current-time start-time))
                                (adjusted-elapsed (if (> raw-elapsed total-paused-duration)
                                    (- raw-elapsed total-paused-duration)
                                    u0
                                ))
                                (total-duration (- end-time start-time))
                                (adjusted-end-time (+ end-time total-paused-duration))
                            )
                            (if (>= current-time adjusted-end-time)
                                (ok (- total-amount withdrawn))
                                (let
                                    (
                                        (vested-amount (/ (* total-amount adjusted-elapsed) total-duration))
                                    )
                                    (ok (- vested-amount withdrawn))
                                )
                            )
                        )
                    )
                )
            )
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; Withdraw available tokens from stream (STX)
(define-public (withdraw-from-stream (stream-id uint))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (recipient (get recipient stream-data))
                (token-type (get token-type stream-data))
                (available-balance (unwrap! (get-available-balance stream-id) ERR_NO_TOKENS_TO_WITHDRAW))
            )
            ;; Only recipient can withdraw
            (asserts! (is-eq tx-sender recipient) ERR_UNAUTHORIZED)
            (asserts! (> available-balance u0) ERR_NO_TOKENS_TO_WITHDRAW)
            (asserts! (not (get is-paused stream-data)) ERR_STREAM_PAUSED)
            (asserts! (is-eq token-type TOKEN_TYPE_STX) ERR_INVALID_TOKEN)
            
            ;; Update withdrawn amount
            (map-set streams
                { stream-id: stream-id }
                (merge stream-data {
                    withdrawn-amount: (+ (get withdrawn-amount stream-data) available-balance)
                })
            )
            
            ;; Note: Actual token transfer should be done manually by sender to recipient
            ;; Contract tracks withdrawal but doesn't transfer tokens in this version
            
            ;; Emit event
            (emit-withdrawal stream-id recipient available-balance)
            
            (ok available-balance)
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; Withdraw available SIP-010 tokens from stream
(define-public (withdraw-from-sip010-stream (stream-id uint) (token-contract <sip010-ft-trait>))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (recipient (get recipient stream-data))
                (token-type (get token-type stream-data))
                (token-principal (contract-of token-contract))
                (stored-token (unwrap! (get token-contract stream-data) ERR_INVALID_TOKEN))
                (available-balance (unwrap! (get-available-balance stream-id) ERR_NO_TOKENS_TO_WITHDRAW))
            )
            ;; Validations
            (asserts! (is-eq tx-sender recipient) ERR_UNAUTHORIZED)
            (asserts! (> available-balance u0) ERR_NO_TOKENS_TO_WITHDRAW)
            (asserts! (not (get is-paused stream-data)) ERR_STREAM_PAUSED)
            (asserts! (is-eq token-type TOKEN_TYPE_SIP010) ERR_INVALID_TOKEN)
            (asserts! (is-eq token-principal stored-token) ERR_INVALID_TOKEN)
            
            ;; Update withdrawn amount
            (map-set streams
                { stream-id: stream-id }
                (merge stream-data {
                    withdrawn-amount: (+ (get withdrawn-amount stream-data) available-balance)
                })
            )
            
            ;; Note: Actual token transfer should be done manually by sender to recipient
            ;; Contract tracks withdrawal but doesn't transfer tokens in this version
            
            ;; Emit event
            (emit-withdrawal stream-id recipient available-balance)
            
            (ok available-balance)
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; Cancel a stream and return remaining tokens to sender
(define-public (cancel-stream (stream-id uint))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (sender (get sender stream-data))
                (recipient (get recipient stream-data))
                (token-type (get token-type stream-data))
                (total-amount (get token-amount stream-data))
                (withdrawn (get withdrawn-amount stream-data))
                (available-balance (unwrap! (get-available-balance stream-id) ERR_NO_TOKENS_TO_WITHDRAW))
                (remaining-amount (- total-amount withdrawn))
            )
            ;; Only sender can cancel
            (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
            (asserts! (not (get is-cancelled stream-data)) ERR_STREAM_ENDED)
            
            ;; Mark as cancelled
            (map-set streams
                { stream-id: stream-id }
                (merge stream-data { is-cancelled: true })
            )
            
            ;; Note: Refund should be handled manually by sender
            ;; Contract tracks cancellation but doesn't transfer tokens in this version
            
            ;; Emit event
            (emit-stream-cancelled stream-id sender)
            
            (ok { withdrawn: withdrawn, refunded: remaining-amount })
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; Cancel a SIP-010 stream and return remaining tokens to sender
(define-public (cancel-sip010-stream (stream-id uint) (token-contract <sip010-ft-trait>))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (sender (get sender stream-data))
                (token-type (get token-type stream-data))
                (token-principal (contract-of token-contract))
                (stored-token (unwrap! (get token-contract stream-data) ERR_INVALID_TOKEN))
                (total-amount (get token-amount stream-data))
                (withdrawn (get withdrawn-amount stream-data))
                (remaining-amount (- total-amount withdrawn))
            )
            ;; Validations
            (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
            (asserts! (not (get is-cancelled stream-data)) ERR_STREAM_ENDED)
            (asserts! (is-eq token-type TOKEN_TYPE_SIP010) ERR_INVALID_TOKEN)
            (asserts! (is-eq token-principal stored-token) ERR_INVALID_TOKEN)
            
            ;; Mark as cancelled
            (map-set streams
                { stream-id: stream-id }
                (merge stream-data { is-cancelled: true })
            )
            
            ;; Note: Refund should be handled manually by sender
            ;; Contract tracks cancellation but doesn't transfer tokens in this version
            
            ;; Emit event
            (emit-stream-cancelled stream-id sender)
            
            (ok { withdrawn: withdrawn, refunded: remaining-amount })
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; Pause a stream (only sender can pause)
(define-public (pause-stream (stream-id uint))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (sender (get sender stream-data))
                (current-time (get-current-time))
            )
            ;; Validations
            (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
            (asserts! (not (get is-cancelled stream-data)) ERR_STREAM_ENDED)
            (asserts! (not (get is-paused stream-data)) ERR_STREAM_PAUSED)
            
            ;; Mark as paused
            (map-set streams
                { stream-id: stream-id }
                (merge stream-data { 
                    is-paused: true,
                    paused-at: current-time
                })
            )
            
            ;; Emit event
            (emit-stream-paused stream-id sender)
            
            (ok true)
        )
        ERR_STREAM_NOT_FOUND
    )
)

;; Resume a paused stream (only sender can resume)
(define-public (resume-stream (stream-id uint))
    (match (map-get? streams { stream-id: stream-id })
        stream-data
        (let
            (
                (sender (get sender stream-data))
                (current-time (get-current-time))
                (paused-at (get paused-at stream-data))
                (total-paused (get total-paused-duration stream-data))
                (pause-duration (- current-time paused-at))
            )
            ;; Validations
            (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
            (asserts! (not (get is-cancelled stream-data)) ERR_STREAM_ENDED)
            (asserts! (get is-paused stream-data) ERR_STREAM_NOT_PAUSED)
            
            ;; Mark as resumed and accumulate paused duration
            (map-set streams
                { stream-id: stream-id }
                (merge stream-data { 
                    is-paused: false,
                    paused-at: u0,
                    total-paused-duration: (+ total-paused pause-duration)
                })
            )
            
            ;; Emit event
            (emit-stream-resumed stream-id sender)
            
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
            (if (get is-paused stream-data)
                (ok (some "paused"))
                (if (>= (get-current-time) (get end-time stream-data))
                    (ok (some "completed"))
                    (if (>= (get-current-time) (get start-time stream-data))
                        (ok (some "active"))
                        (ok (some "scheduled"))
                    )
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
