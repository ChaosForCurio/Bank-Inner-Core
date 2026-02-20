const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const emailService = require("../services/email.service")


/**
 * Create new transaction
 * the 10 step transfer flow
 * 1. Validate request
 * 2. Check idempotency
 * 3. Validate accounts
 * 4. Send email notification
 * 5. Check account status
 * 6. Derive sender balance from ledger
 * 7. Create transaction (pending)
 * 8. Create debit ledger entry
 * 9. Create credit ledger entry
 * 10. Update transaction (completed)
 */