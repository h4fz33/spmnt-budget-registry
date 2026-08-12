# Accounting System Blueprint for Educational Institutions
## Fund-Flow Analysis and System Design Specification

**Document Version:** 1.0  
**Date:** August 11, 2026  
**Purpose:** This blueprint maps the 14 fund-flow patterns (FF-01 to FF-14) from regulatory requirements to the actual transaction categories implemented in the E-BUDGET system, providing technical specifications for database schema, transaction processing rules, and control mechanisms.

---

## Executive Summary

This document analyzes the complete fund-flow lifecycle across 6 major categories and 14 distinct patterns, as required by the Ministry of Finance regulations and OBEC (Office of the Basic Education Commission) guidelines. Each fund-flow pattern is mapped to specific sections in the interactive accounting sheets to ensure proper recording, control, and reporting.

---

## 1. Fund-Flow Architecture Overview

### 1.1 System Components

The accounting system manages three primary position states:
- **Cash on Hand** (เงินสด)
- **Bank Deposits** (เงินฝากธนาคาร)
- **Documents as Money Substitutes** (เอกสารแทนตัวเงิน) - advance contracts, petty cash vouchers

### 1.2 Fund Categories in the System

Based on the interactive sheets analysis, the system tracks:

1. **Budget Reserves for Carryover** (เงินกันไว้เบิกจ่ายเหลื่อมปี)
2. **State Revenue Balance** (เงินรายได้แผ่นดินคงเหลือ)
3. **Non-Budgetary Funds Balance** (เงินนอกงบประมาณคงเหลือ)
   - 3.1 General subsidy for 15-year free education program
   - 3.2 Other general subsidies
   - 3.3 School maintenance fees
   - 3.4 Donations
   - 3.5 School income
   - 3.6 Student loan operation expenses
   - 3.7 Contract security deposits
   - 3.8 Withheld tax
   - 3.9-3.12 Scout/Guide/Red Cross funds
4. **Other Funds** (เงินอื่นๆ)

---

## 2. Category 1: Budget Management (Direct Payment)

### 2.1 FF-01: Budget Direct-Payment Claim

**Flow Description:**  
The school submits claim documents but does NOT receive actual cash. Payment is made directly by the Comptroller General's Department or ESAO (Educational Service Area Office).

**Interactive Sheet Mapping:**  
- **Not recorded in Section 2** (balance) or **Section 3** (income)
- **Not recorded in cash book** as no cash is received

**System Recording Requirements:**
```
REGISTER: Evidence Control Register (ทะเบียนคุมหลักฐานขอเบิก)
FIELDS:
  - claim_id (auto-increment)
  - submission_date
  - claim_type (medical, rent, procurement)
  - claimant_name
  - amount
  - document_reference
  - submitted_to (ESAO/Comptroller)
  - status (submitted, confirmed_paid, rejected)
  
ACTION: Record submission only
NO_IMPACT_ON: Cash position, bank balance
```

**Control Mechanism:**
- Link claim submission (FF-01) with payment confirmation (FF-02)
- Alert mechanism for claims pending over 30 days
- Prevent duplicate submission of same evidence

**Database Schema:**
```sql
CREATE TABLE claim_evidence_register (
    claim_id INT PRIMARY KEY AUTO_INCREMENT,
    submission_date DATE NOT NULL,
    claim_type ENUM('medical', 'rent', 'procurement', 'other'),
    claimant_name VARCHAR(255),
    amount DECIMAL(15,2),
    document_ref VARCHAR(100),
    submitted_to ENUM('ESAO', 'Comptroller'),
    status ENUM('submitted', 'confirmed_paid', 'rejected') DEFAULT 'submitted',
    payment_date DATE NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.2 FF-02: Direct-Payment Confirmation

**Flow Description:**  
Upon receiving notification from ESAO or Comptroller that payment has been made to the creditor/beneficiary.

**Interactive Sheet Mapping:**  
- **Not recorded in Section 3** (no income received)
- **Update status only** in Evidence Control Register

**System Recording Requirements:**
```
UPDATE: Evidence Control Register
FIELDS:
  - status → 'confirmed_paid'
  - payment_date → date from notification
  - notes → "Paid directly by [ESAO/Comptroller] on [date]"
  
ACTION: Status update only
NO_IMPACT_ON: Cash position, bank balance
```

**Control Mechanism:**
- Cross-reference claim_id from FF-01
- Generate monthly report of outstanding claims (submitted but not confirmed)
- Alert for claims older than 60 days without confirmation

---

## 3. Category 2: Non-Budgetary Fund Management

### 3.1 FF-03: Retainable Non-Budgetary Receipt

**Flow Description:**  
Receipt of funds that the school can retain and spend according to approved purposes. Includes school income, per-capita subsidies (5 items), donations, and school lunch program funds.

**Interactive Sheet Mapping:**  
- **Section 2:** Opening balance (if carried from previous year)
  - Row: "3. เงินนอกงบประมาณคงเหลือ" (Non-budgetary funds balance)
- **Section 3:** Income received during the year
  - Rows: Various sub-categories under "เงินนอกงบประมาณ"

**System Recording Requirements:**
```
REGISTER: Non-Budgetary Fund Register (by type)
DOCUMENT: Issue receipt (except bank interest)
CASH_BOOK: Record as RECEIPT
IMPACT: Cash or Bank Deposit INCREASES

TRANSACTION_FLOW:
1. Receive money → Issue receipt
2. Record in cash book (Dr. Cash/Bank, Cr. Revenue)
3. Record in specific fund type register
4. Update daily cash balance report
```

**Receipt Categories in Section 3:**
- **3.1** General subsidy - 15-year free education (5 items):
  - Textbooks and learning materials
  - Student activities
  - School uniforms
  - Education support equipment
  - Basic necessities for disadvantaged students
- **3.2** Other general subsidies
- **3.3** School maintenance fees (เงินบำรุงการศึกษา)
- **3.4** Donations (เงินบริจาค)
- **3.5** School income (เงินรายได้สถานศึกษา)
- **3.6** Student loan operation expenses (กยศ.)
- **3.7** Contract security deposits (เงินประกันสัญญา)
- **3.8** Withheld tax (ภาษีหัก ณ ที่จ่าย)
- **3.9-3.12** Scout/Guide/Red Cross funds

**Database Schema:**
```sql
CREATE TABLE non_budgetary_receipts (
    receipt_id INT PRIMARY KEY AUTO_INCREMENT,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    receipt_date DATE NOT NULL,
    fund_type ENUM('subsidy_15yr', 'other_subsidy', 'maintenance_fee', 
                   'donation', 'school_income', 'loan_ops', 'security_deposit',
                   'withheld_tax', 'scout', 'guide', 'red_cross', 'other'),
    sub_category VARCHAR(100),
    payer_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash', 'check', 'bank_transfer'),
    description TEXT,
    is_receipt_issued BOOLEAN DEFAULT TRUE,
    fiscal_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fund_type, sub_category) 
        REFERENCES fund_type_master(type_code, sub_code)
);

CREATE TABLE cash_book (
    entry_id INT PRIMARY KEY AUTO_INCREMENT,
    entry_date DATE NOT NULL,
    entry_type ENUM('receipt', 'payment'),
    reference_type ENUM('receipt', 'voucher', 'advance', 'other'),
    reference_number VARCHAR(50),
    description VARCHAR(500),
    amount DECIMAL(15,2) NOT NULL,
    running_balance DECIMAL(15,2) NOT NULL,
    fund_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date (entry_date),
    INDEX idx_fund (fund_type)
);
```

**Control Rules:**
- Must issue receipt for all cash/check receipts (except bank interest)
- Receipt number must be sequential and cannot be skipped
- Record in cash book on the same day
- Daily reconciliation: Physical Cash + Document Substitutes + Bank = Cash Book Balance

---

### 3.2 FF-04: Non-Budgetary Expense

**Flow Description:**  
Payment from non-budgetary funds according to approved projects/activities in the annual action plan.

**Interactive Sheet Mapping:**  
- **Section 4 (Part 1):** Expenses from Oct 1 - Mar 31
- **Section 4 (Part 2):** Expenses from Apr 1 - Sep 30

**Expense Categories Mapped:**

**Column Structure in Section 4:**
- Column D: Budget funds (เงินงบประมาณ)
- Column E: Maintenance fees (เงินบำรุง)
- Column F: Donations (เงินบริจาค)
- Column G: School income (เงินรายได้)
- Column H: Subsidies (เงินอุดหนุน)
- Column I: Other funds (อื่นๆ)
- Column J: State revenue (เงินรายได้แผ่นดิน)

**Major Expense Categories:**
1. **Academic Administration**
   - Textbooks, learning materials
   - Library books
   - Teaching materials
   - Laboratory equipment
   - Sports equipment
   
2. **Personnel Management (2.1)**
   - Budget personnel salaries (from central budget)
   - Contract teachers (from OBEC)
   - Contract teachers (from local government)
   - Contract teachers (from other funds)
   - Special allowances
   - Social security contributions

3. **Budget Administration (3.)**
   - Utilities (electricity, water)
   - Internet services
   - Building maintenance/repairs
   - Equipment purchases

4. **Student Affairs (4.)**
   - Basic necessities for disadvantaged students
   - School lunch program
   - Scout/Guide/Red Cross activities
   - Student loan operations
   - Equal opportunity scholarships (CCT program)

5. **Financial Management (5.)**
   - Contract security deposits (outbound)
   - Withheld tax payments
   - Fund returns to government agencies

**System Recording Requirements:**
```
REGISTER: Non-Budgetary Fund Register (by type)
DOCUMENT: Receipt from creditor OR petty cash voucher
STAMP: "PAID" on receipt
CASH_BOOK: Record as PAYMENT
IMPACT: Cash or Bank Deposit DECREASES

TRANSACTION_FLOW:
1. Verify approved budget allocation
2. Create payment voucher
3. Obtain creditor receipt
4. Stamp "จ่ายเงินแล้ว" (PAID) on receipt
5. Record in cash book (Dr. Expense, Cr. Cash/Bank)
6. Record in specific fund type register
7. Update daily cash balance report
```

**Database Schema:**
```sql
CREATE TABLE non_budgetary_expenses (
    expense_id INT PRIMARY KEY AUTO_INCREMENT,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    expense_date DATE NOT NULL,
    fund_source ENUM('budget', 'maintenance_fee', 'donation', 
                     'school_income', 'subsidy', 'other', 'state_revenue'),
    expense_category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    payee_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash', 'check', 'bank_transfer'),
    receipt_number VARCHAR(100),
    project_code VARCHAR(50),
    budget_code VARCHAR(50),
    description TEXT,
    is_receipt_stamped BOOLEAN DEFAULT FALSE,
    fiscal_year YEAR,
    semester ENUM('1', '2'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_code) REFERENCES approved_projects(code),
    INDEX idx_date_fund (expense_date, fund_source),
    INDEX idx_category (expense_category)
);
```

**Control Rules:**
- Payment must be within approved annual action plan
- Must have creditor receipt with "PAID" stamp
- Cannot exceed fund type balance
- Record payment in cash book on same day
- Multi-fund payment must be recorded separately per fund source

---

## 4. Category 3: State Income Management

### 4.1 FF-05: State Income Receipt

**Flow Description:**  
Receipt of money that MUST be remitted to the Treasury. Cannot be used for school expenses. Sources include: sales of damaged property, bank interest on general subsidy, or returned surplus from prior years.

**Interactive Sheet Mapping:**  
- **Section 2:** Row "2. เงินรายได้แผ่นดินคงเหลือ" (State income balance)
- **Section 3:** Income items marked as state revenue
- **Special register:** State Income Control Register (ทะเบียนคุมการรับและนำส่งเงินรายได้แผ่นดิน)

**System Recording Requirements:**
```
REGISTER: State Income Control Register
CASH_BOOK: Record as RECEIPT
LIABILITY: Creates obligation to remit to Treasury
IMPACT: Cash increases + Liability to remit increases

TRANSACTION_FLOW:
1. Receive state income → Record in control register
2. Record in cash book (Dr. Cash, Cr. Payable to Treasury)
3. Generate remittance schedule
4. Alert when remittance deadline approaches

REMITTANCE_RULES:
- At least once per month
- Within 3 business days if amount exceeds 10,000 baht
- Submit to ESAO with remittance form
```

**Database Schema:**
```sql
CREATE TABLE state_income_register (
    income_id INT PRIMARY KEY AUTO_INCREMENT,
    receipt_date DATE NOT NULL,
    income_source ENUM('damaged_goods_sale', 'bank_interest_subsidy', 
                       'surplus_return', 'other'),
    description VARCHAR(500),
    amount DECIMAL(15,2) NOT NULL,
    receipt_number VARCHAR(50),
    remittance_status ENUM('pending', 'remitted') DEFAULT 'pending',
    remittance_due_date DATE,
    remitted_date DATE NULL,
    remittance_ref VARCHAR(100),
    fiscal_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_remittance_status (remittance_status, remittance_due_date)
);

-- Trigger to set remittance due date
DELIMITER //
CREATE TRIGGER set_remittance_due_date
BEFORE INSERT ON state_income_register
FOR EACH ROW
BEGIN
    IF NEW.amount > 10000 THEN
        SET NEW.remittance_due_date = DATE_ADD(NEW.receipt_date, INTERVAL 3 DAY);
    ELSE
        SET NEW.remittance_due_date = LAST_DAY(NEW.receipt_date);
    END IF;
END //
DELIMITER ;
```

**Alert Mechanism:**
- Daily check for pending remittances past due date
- Weekly summary of total pending remittances
- Prevent closing month if state income not remitted

---

### 4.2 FF-06: State Income Remittance

**Flow Description:**  
Transfer of state income to ESAO. Must be remitted monthly or within 3 days if exceeding 10,000 baht.

**Interactive Sheet Mapping:**  
- **Cash book:** Record as payment
- **State Income Register:** Record remittance in "parentheses notation" (ตัวเลขในวงเล็บ)

**System Recording Requirements:**
```
UPDATE: State Income Control Register
CASH_BOOK: Record as PAYMENT (not regular expense)
IMPACT: Cash decreases + Liability to remit decreases

TRANSACTION_FLOW:
1. Prepare remittance form
2. Transfer funds to ESAO
3. Record in cash book (Dr. Payable to Treasury, Cr. Cash/Bank)
4. Update register with remittance amount in (parentheses)
5. Update remittance_status → 'remitted'
6. File remittance receipt from ESAO
```

**Database Schema:**
```sql
CREATE TABLE state_income_remittances (
    remittance_id INT PRIMARY KEY AUTO_INCREMENT,
    remittance_date DATE NOT NULL,
    remittance_ref VARCHAR(100) NOT NULL UNIQUE,
    total_amount DECIMAL(15,2) NOT NULL,
    remitted_to ENUM('ESAO', 'Treasury_Direct'),
    receipt_from_esao VARCHAR(100),
    fiscal_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE state_income_remittance_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    remittance_id INT NOT NULL,
    income_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    FOREIGN KEY (remittance_id) REFERENCES state_income_remittances(remittance_id),
    FOREIGN KEY (income_id) REFERENCES state_income_register(income_id)
);
```

**Control Rules:**
- Cannot remit more than pending balance
- Remittance updates both cash book and register
- Register shows running balance with remittances in parentheses
- Monthly reconciliation: Opening + Receipts - (Remittances) = Ending

---

## 5. Category 4: Security Deposits & Withheld Tax

### 5.1 FF-07: Contract Security Receipt

**Flow Description:**  
Receipt of cash/check as contract security deposit from contractors/vendors.

**Interactive Sheet Mapping:**  
- **Section 3:** Row "3.7 เงินประกันสัญญา" (Contract security deposits)
- **Special register:** Contract Security Register (ทะเบียนคุมเงินประกันสัญญา)

**System Recording Requirements:**
```
REGISTER: Contract Security Register OR Non-Budgetary Fund Register (Deposits category)
CASH_BOOK: Record as RECEIPT
LIABILITY: Creates obligation to return upon contract completion
IMPACT: Cash increases + Liability to return increases

TRANSACTION_FLOW:
1. Receive security deposit from contractor
2. Issue receipt
3. Record in cash book (Dr. Cash, Cr. Security Deposit Payable)
4. Record in contract security register with:
   - Contract number
   - Contractor name
   - Deposit amount
   - Contract period
   - Expected return date
```

**Database Schema:**
```sql
CREATE TABLE contract_security_deposits (
    deposit_id INT PRIMARY KEY AUTO_INCREMENT,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    contractor_name VARCHAR(255) NOT NULL,
    contract_date DATE NOT NULL,
    contract_amount DECIMAL(15,2) NOT NULL,
    deposit_amount DECIMAL(15,2) NOT NULL,
    deposit_percentage DECIMAL(5,2),
    receipt_date DATE NOT NULL,
    receipt_number VARCHAR(50),
    contract_start_date DATE,
    contract_end_date DATE,
    expected_return_date DATE,
    deposit_status ENUM('active', 'returned', 'forfeited') DEFAULT 'active',
    return_date DATE NULL,
    return_amount DECIMAL(15,2) NULL,
    notes TEXT,
    fiscal_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status_return (deposit_status, expected_return_date)
);
```

**Control Rules:**
- Issue receipt for all deposits
- Track contract completion dates
- Alert when contract end date approaches for deposit return processing

---

### 5.2 FF-08: Contract Security Return

**Flow Description:**  
Payment to return security deposit when contract period expires, typically processed through ESAO withdrawal.

**Interactive Sheet Mapping:**  
- **Section 4:** Recorded as payment when confirmed
- **Contract Security Register:** Update status to 'returned'

**System Recording Requirements:**
```
PROCESS: Often requires withdrawal from ESAO deposit account
CASH_BOOK: Record as PAYMENT when confirmation received
IMPACT: Cash decreases + Liability to return decreases

TRANSACTION_FLOW:
1. Verify contract completion and compliance
2. Request withdrawal from ESAO (if deposited there)
3. Upon receiving withdrawal confirmation, pay contractor
4. Record in cash book (Dr. Security Deposit Payable, Cr. Cash)
5. Update contract security register status → 'returned'
6. File return receipt from contractor
```

**Database Schema:**
```sql
CREATE TABLE contract_security_returns (
    return_id INT PRIMARY KEY AUTO_INCREMENT,
    deposit_id INT NOT NULL,
    return_date DATE NOT NULL,
    return_amount DECIMAL(15,2) NOT NULL,
    withdrawal_request_ref VARCHAR(100),
    esao_confirmation_ref VARCHAR(100),
    contractor_receipt_ref VARCHAR(100),
    return_method ENUM('cash', 'check', 'bank_transfer'),
    deductions DECIMAL(15,2) DEFAULT 0,
    deduction_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (deposit_id) REFERENCES contract_security_deposits(deposit_id)
);
```

**Control Rules:**
- Verify contract completion before return
- Check for any penalties or deductions
- Return amount = Deposit amount - Deductions
- Cannot return more than deposited
- Update register immediately upon payment

---

### 5.3 FF-09: Withheld Tax Recognition

**Flow Description:**  
Tax withheld at source when paying creditors, held temporarily before remittance to Revenue Department.

**Interactive Sheet Mapping:**  
- **Section 3:** Row "3.8 เงินภาษีหัก ณ ที่จ่าย" (Withheld tax)
- **Special register:** Non-Budgetary Fund Register - Withheld Tax category

**System Recording Requirements:**
```
DOCUMENT: Issue tax withholding certificate (PND 1, 3, 53 or similar)
REGISTER: Non-Budgetary Fund Register (Withheld Tax type)
TIMING: Recognized at payment to creditor
LIABILITY: Creates obligation to remit to Revenue Department

TRANSACTION_FLOW:
1. Calculate tax to withhold from payment
2. Pay net amount to creditor (Invoice Amount - Withheld Tax)
3. Issue tax withholding certificate to payee
4. Record withheld amount in register
5. Track for remittance deadline (7 or 15 days from month end)

TAX_TYPES:
- WHT on services (3%)
- WHT on rent (5%)
- WHT on professional fees (3-5%)
- WHT on advertising (2%)
```

**Database Schema:**
```sql
CREATE TABLE withheld_tax_register (
    wht_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_date DATE NOT NULL,
    payment_voucher_ref VARCHAR(100),
    payee_name VARCHAR(255) NOT NULL,
    payee_tax_id VARCHAR(20),
    gross_amount DECIMAL(15,2) NOT NULL,
    wht_rate DECIMAL(5,2) NOT NULL,
    wht_amount DECIMAL(15,2) NOT NULL,
    net_paid DECIMAL(15,2) NOT NULL,
    tax_type ENUM('PND1', 'PND3', 'PND53', 'other'),
    income_type VARCHAR(100),
    certificate_number VARCHAR(50),
    remittance_status ENUM('pending', 'remitted') DEFAULT 'pending',
    remittance_due_date DATE,
    remitted_date DATE NULL,
    remittance_ref VARCHAR(100),
    fiscal_year YEAR,
    tax_month INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_remittance (remittance_status, remittance_due_date),
    INDEX idx_payee (payee_tax_id, fiscal_year)
);
```

**Control Rules:**
- Issue certificate within 7 days of payment
- Cannot withhold more than gross amount
- Track remittance deadline by submission method (paper vs online)
- Generate monthly WHT summary report

---

### 5.4 FF-10: Withheld Tax Remittance

**Flow Description:**  
Transfer of withheld tax to Revenue Department within deadline: 7 days (regular filing) or 15 days (online filing) from month end.

**Interactive Sheet Mapping:**  
- **Section 4:** Record as payment when submitted
- **Withheld Tax Register:** Update remittance status

**System Recording Requirements:**
```
DOCUMENT: PND forms (1, 3, 53) filed with Revenue Department
CASH_BOOK: Record as PAYMENT
IMPACT: Cash decreases + Tax payable decreases

TRANSACTION_FLOW:
1. Prepare monthly WHT summary and PND forms
2. Submit to Revenue Department (online or in-person)
3. Pay tax amount
4. Record in cash book (Dr. Tax Payable, Cr. Cash/Bank)
5. Update withheld tax register → 'remitted'
6. File Revenue Department receipt

DEADLINES:
- Regular filing: 7 days from month end
- Online filing: 15 days from month end
```

**Database Schema:**
```sql
CREATE TABLE wht_remittances (
    remittance_id INT PRIMARY KEY AUTO_INCREMENT,
    remittance_date DATE NOT NULL,
    tax_month INT NOT NULL,
    fiscal_year YEAR NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    filing_method ENUM('online', 'paper'),
    pnd_type ENUM('PND1', 'PND3', 'PND53'),
    submission_ref VARCHAR(100),
    revenue_receipt_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_month_year_type (tax_month, fiscal_year, pnd_type)
);

CREATE TABLE wht_remittance_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    remittance_id INT NOT NULL,
    wht_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    FOREIGN KEY (remittance_id) REFERENCES wht_remittances(remittance_id),
    FOREIGN KEY (wht_id) REFERENCES withheld_tax_register(wht_id)
);
```

**Control Rules:**
- Cannot remit more than pending balance
- Alert 3 days before deadline
- Penalty calculation if late
- Monthly reconciliation mandatory

---

## 6. Category 5: Official Advance Management

### 6.1 FF-11: Official Advance Disbursement

**Flow Description:**  
Payment of advance funds to staff for official duties. NOT a true expense yet - creates a receivable (document substitute for money).

**Interactive Sheet Mapping:**  
- **NOT recorded in Section 4** (expenses)
- **Special register:** Document Substitute Register (ทะเบียนคุมเอกสารแทนตัวเงิน)
- **Daily cash report:** Include advance contract value in balance calculation

**System Recording Requirements:**
```
DOCUMENT: Official advance contract (2 copies)
REGISTER: Document Substitute Register
DAILY_REPORT: Include advance amount in "documents as money"
CASH_BOOK: DO NOT record as payment
IMPACT: Cash decreases, Document Substitute increases (net zero to total position)

TRANSACTION_FLOW:
1. Borrower submits advance request with justification
2. Check borrower has no outstanding advances (BLOCKING RULE)
3. Approve advance contract (2 copies: 1 for school, 1 for borrower)
4. Pay cash to borrower
5. Record in Document Substitute Register
6. Update daily cash position report

IMPORTANT: This is NOT an expense - it's a position transfer from Cash to Receivable
```

**Database Schema:**
```sql
CREATE TABLE official_advances (
    advance_id INT PRIMARY KEY AUTO_INCREMENT,
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    contract_date DATE NOT NULL,
    borrower_id INT NOT NULL,
    borrower_name VARCHAR(255) NOT NULL,
    advance_amount DECIMAL(15,2) NOT NULL,
    purpose TEXT NOT NULL,
    expected_settlement_date DATE NOT NULL,
    fund_source VARCHAR(100),
    status ENUM('active', 'settled_expense', 'settled_cash', 'partial') DEFAULT 'active',
    disbursed_date DATE,
    settled_date DATE NULL,
    settled_amount DECIMAL(15,2) DEFAULT 0,
    expense_amount DECIMAL(15,2) DEFAULT 0,
    cash_return_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    fiscal_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (borrower_id) REFERENCES staff(staff_id),
    INDEX idx_borrower_status (borrower_id, status),
    INDEX idx_status_date (status, expected_settlement_date)
);

-- Prevent multiple active advances per borrower
CREATE UNIQUE INDEX idx_one_active_per_borrower 
ON official_advances(borrower_id, status) 
WHERE status = 'active';
```

**Blocking Rule Implementation:**
```sql
-- Trigger to prevent new advance if borrower has outstanding balance
DELIMITER //
CREATE TRIGGER check_outstanding_before_advance
BEFORE INSERT ON official_advances
FOR EACH ROW
BEGIN
    DECLARE outstanding_count INT;
    
    SELECT COUNT(*) INTO outstanding_count
    FROM official_advances
    WHERE borrower_id = NEW.borrower_id
      AND status = 'active';
    
    IF outstanding_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot create new advance: borrower has outstanding advance';
    END IF;
END //
DELIMITER ;
```

**Control Rules:**
- **CRITICAL:** Block new advance approval if borrower has any unsettled advance (FF-12 or FF-13 not completed)
- Contract must have two signatures: borrower and approver
- Expected settlement date must be within reasonable timeframe (typically 30-60 days)
- Daily cash position = Physical Cash + Advance Contracts + Bank Deposits

---

### 6.2 FF-12: Official Advance Settlement By Expense

**Flow Description:**  
Borrower submits expense receipts to clear the advance liability. This converts the receivable into actual expenses.

**Interactive Sheet Mapping:**  
- **Section 4:** Record as EXPENSE (by fund source)
- **Document Substitute Register:** Add note about settlement after contract entry

**System Recording Requirements:**
```
DOCUMENT: Creditor receipts for expenses incurred
REGISTER: Update Document Substitute Register with settlement note
          Record in fund-specific expense register
CASH_BOOK: Record as PAYMENT (Dr. Expense, Cr. Document Substitute)
IMPACT: Document Substitute decreases, Expense recorded

TRANSACTION_FLOW:
1. Borrower submits expense receipts
2. Verify receipts are valid and within approved purpose
3. Calculate: Advance Amount vs Expense Amount
4. If Expense < Advance: borrower must return cash difference (trigger FF-13)
5. If Expense = Advance: fully settled
6. Record expense in cash book and appropriate fund register
7. Update advance status → 'settled_expense' or 'partial'
8. Add settlement note in Document Substitute Register
```

**Database Schema:**
```sql
CREATE TABLE advance_settlements (
    settlement_id INT PRIMARY KEY AUTO_INCREMENT,
    advance_id INT NOT NULL,
    settlement_date DATE NOT NULL,
    settlement_type ENUM('expense', 'cash_return', 'mixed'),
    total_expense_amount DECIMAL(15,2) DEFAULT 0,
    cash_return_amount DECIMAL(15,2) DEFAULT 0,
    settlement_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (advance_id) REFERENCES official_advances(advance_id)
);

CREATE TABLE advance_expense_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    settlement_id INT NOT NULL,
    expense_date DATE NOT NULL,
    vendor_name VARCHAR(255),
    receipt_number VARCHAR(100),
    description VARCHAR(500),
    amount DECIMAL(15,2) NOT NULL,
    expense_category VARCHAR(100),
    fund_source VARCHAR(100),
    
    FOREIGN KEY (settlement_id) REFERENCES advance_settlements(settlement_id)
);
```

**Control Rules:**
- Receipts must be within advance purpose
- Total settlements cannot exceed advance amount
- Late settlement (past expected date) requires explanation
- Settlement by expense DOES record in cash book as payment
- Update advance status based on settlement progress

---

### 6.3 FF-13: Official Advance Unused Cash Return

**Flow Description:**  
Borrower returns unused cash from the advance. This reduces the receivable without creating an expense.

**Interactive Sheet Mapping:**  
- **NOT recorded in Section 3** (not income)
- **NOT recorded in Section 4** (not expense)
- **Document Substitute Register:** Update with return note
- **Do NOT issue receipt** (not revenue)

**System Recording Requirements:**
```
REGISTER: Update Document Substitute Register with cash return
CASH_BOOK: DO NOT record (neither receipt nor payment)
NO_RECEIPT: Do not issue receipt for cash return
IMPACT: Cash increases, Document Substitute decreases (position transfer only)

TRANSACTION_FLOW:
1. Borrower returns unused cash
2. Count and verify cash amount
3. Update Document Substitute Register with return amount
4. Update advance record
5. If fully settled: close advance (status → 'settled_cash')
6. DO NOT record in cash book
7. DO NOT issue receipt

IMPORTANT: Cash return is a position reversal, not income
```

**Database Schema:**
```sql
CREATE TABLE advance_cash_returns (
    return_id INT PRIMARY KEY AUTO_INCREMENT,
    advance_id INT NOT NULL,
    return_date DATE NOT NULL,
    return_amount DECIMAL(15,2) NOT NULL,
    return_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (advance_id) REFERENCES official_advances(advance_id)
);

-- Trigger to update advance status after cash return
DELIMITER //
CREATE TRIGGER update_advance_after_return
AFTER INSERT ON advance_cash_returns
FOR EACH ROW
BEGIN
    DECLARE total_settled DECIMAL(15,2);
    DECLARE advance_amt DECIMAL(15,2);
    
    SELECT advance_amount INTO advance_amt
    FROM official_advances
    WHERE advance_id = NEW.advance_id;
    
    SELECT COALESCE(SUM(expense_amount), 0) + COALESCE(SUM(cash_return_amount), 0)
    INTO total_settled
    FROM official_advances
    WHERE advance_id = NEW.advance_id;
    
    UPDATE official_advances
    SET cash_return_amount = cash_return_amount + NEW.return_amount,
        status = CASE 
            WHEN (expense_amount + cash_return_amount + NEW.return_amount) >= advance_amount 
            THEN 'settled_cash'
            ELSE 'partial'
        END
    WHERE advance_id = NEW.advance_id;
END //
DELIMITER ;
```

**Control Rules:**
- Cannot return more than outstanding advance balance
- Return amount + Expense amount ≤ Advance amount
- Do NOT issue receipt (common mistake)
- Do NOT record in cash book (another common mistake)
- Update daily cash position report to reflect reduced document substitute

---

## 7. Category 6: Internal Position Transfer

### 7.1 FF-14: Internal Money-Position Transfer

**Flow Description:**  
Movement of money between storage methods without affecting total fund balance: cash to bank, bank to cash, or deposit to ESAO treasury deposit account.

**Interactive Sheet Mapping:**  
- **NOT recorded in Section 3** (not income)
- **NOT recorded in Section 4** (not expense)
- **NOT recorded in cash book** (no receipt or payment)
- **Daily cash position report:** Change position status only
- **Bank passbook register:** Record deposit/withdrawal

**System Recording Requirements:**
```
TRANSACTIONS:
- Deposit cash to bank
- Withdraw cash from bank
- Transfer to ESAO treasury deposit account
- Withdraw from ESAO treasury deposit

IMPACT: Change position type only (Cash ↔ Bank ↔ ESAO Deposit)
        Total balance remains unchanged

RECORDING:
- Update Daily Cash Position Report (position status change)
- Update Bank Passbook Register
- Update ESAO Deposit Passbook (if applicable)
- DO NOT record in cash book

FORMULA_CHECK:
Physical Cash + Document Substitutes + Bank Balance + ESAO Deposit = Total Position
(Before transfer) = (After transfer)
```

**Database Schema:**
```sql
CREATE TABLE position_transfers (
    transfer_id INT PRIMARY KEY AUTO_INCREMENT,
    transfer_date DATE NOT NULL,
    transfer_type ENUM('cash_to_bank', 'bank_to_cash', 
                       'cash_to_esao', 'esao_to_cash',
                       'bank_to_esao', 'esao_to_bank'),
    amount DECIMAL(15,2) NOT NULL,
    from_position ENUM('cash', 'bank', 'esao_deposit'),
    to_position ENUM('cash', 'bank', 'esao_deposit'),
    bank_account_number VARCHAR(50),
    transaction_ref VARCHAR(100),
    description TEXT,
    fiscal_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date_type (transfer_date, transfer_type)
);

CREATE TABLE daily_cash_position (
    position_id INT PRIMARY KEY AUTO_INCREMENT,
    position_date DATE NOT NULL UNIQUE,
    cash_on_hand DECIMAL(15,2) NOT NULL DEFAULT 0,
    document_substitutes DECIMAL(15,2) NOT NULL DEFAULT 0,
    bank_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    esao_deposit DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_position DECIMAL(15,2) GENERATED ALWAYS AS 
        (cash_on_hand + document_substitutes + bank_balance + esao_deposit) STORED,
    cash_book_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    variance DECIMAL(15,2) GENERATED ALWAYS AS 
        (total_position - cash_book_balance) STORED,
    reconciled BOOLEAN DEFAULT FALSE,
    reconciliation_notes TEXT,
    fiscal_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_reconciled (reconciled, position_date)
);
```

**Control Rules:**
- Position transfer does NOT affect cash book balance
- Must maintain daily position report
- **Daily reconciliation formula:**
  ```
  Physical Cash + Document Substitutes + Bank + ESAO Deposit = Cash Book Balance
  ```
- Any variance must be investigated and explained
- Alert if variance exceeds threshold (e.g., 10 baht tolerance for rounding)

---

## 8. System Control Mechanisms

### 8.1 Daily Reconciliation Rules

**Mandatory Daily Check (End of Business Day):**
```sql
-- Daily position reconciliation
SELECT 
    position_date,
    cash_on_hand,
    document_substitutes,
    bank_balance,
    esao_deposit,
    total_position,
    cash_book_balance,
    variance
FROM daily_cash_position
WHERE position_date = CURDATE()
  AND ABS(variance) > 10;  -- Alert if variance > 10 baht
```

**Components that must balance:**
1. **Cash Position:**
   - Physical cash counted
   - Advance contracts outstanding
   - Bank balance (from passbook)
   - ESAO deposits
   
2. **Cash Book Balance:**
   - Opening balance
   - Plus: All receipts (FF-03, FF-05, FF-07)
   - Minus: All payments (FF-04, FF-06, FF-08, FF-10, advance settlements)
   - Equals: Closing balance

3. **Variance Investigation:**
   - If variance exists → immediate investigation
   - Common causes: unrecorded transaction, calculation error, theft
   - Document explanation in reconciliation notes

---

### 8.2 Sequential Recording Rules

**Chronological Order (Cannot be violated):**
```
RULE: All transactions must be recorded in date-time sequence
ENFORCEMENT:
- Each register maintains sequential entry numbers
- Cannot skip numbers
- Cannot backdate entries
- Cannot delete entries (only void with explanation)
```

**Implementation:**
```sql
-- Trigger to enforce chronological order
DELIMITER //
CREATE TRIGGER enforce_chronological_order
BEFORE INSERT ON cash_book
FOR EACH ROW
BEGIN
    DECLARE last_entry_date DATE;
    
    SELECT MAX(entry_date) INTO last_entry_date
    FROM cash_book
    WHERE entry_id < NEW.entry_id;
    
    IF NEW.entry_date < last_entry_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot record entry before last recorded date';
    END IF;
END //
DELIMITER ;
```

---

### 8.3 Advance Blocking Mechanism

**Critical Business Rule:**
> "Cannot approve new advance if borrower has outstanding balance"

**Implementation:**
```sql
-- Check before advance approval
CREATE PROCEDURE check_borrower_eligibility(IN p_borrower_id INT)
BEGIN
    DECLARE v_outstanding_count INT;
    DECLARE v_outstanding_amount DECIMAL(15,2);
    
    SELECT 
        COUNT(*),
        COALESCE(SUM(advance_amount - expense_amount - cash_return_amount), 0)
    INTO v_outstanding_count, v_outstanding_amount
    FROM official_advances
    WHERE borrower_id = p_borrower_id
      AND status = 'active';
    
    IF v_outstanding_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT('Borrower has ', v_outstanding_count, 
                                  ' outstanding advance(s) totaling ', 
                                  v_outstanding_amount, ' baht');
    END IF;
END //
```

**UI Implementation:**
- Display warning badge on borrower profile if outstanding advances exist
- Disable "Create New Advance" button until previous advances settled
- Show outstanding advance details with settlement deadline

---

## 9. Fund-Flow Summary Matrix

### 9.1 Complete Fund-Flow Mapping

| FF Code | Name | Cash Book Entry | Fund Register | Receipts/Docs | Section 3 | Section 4 |
|---------|------|-----------------|---------------|---------------|-----------|-----------|
| FF-01 | Budget Direct-Payment Claim | No | Evidence Control | Claim docs | No | No |
| FF-02 | Direct-Payment Confirmation | No | Update status | Confirmation | No | No |
| FF-03 | Retainable Non-Budget Receipt | Yes (Receipt) | Yes | Issue receipt | Yes | - |
| FF-04 | Non-Budget Expense | Yes (Payment) | Yes | Creditor receipt | - | Yes |
| FF-05 | State Income Receipt | Yes (Receipt) | State Income Reg | Record only | Yes* | - |
| FF-06 | State Income Remittance | Yes (Payment) | Update (parens) | Remit form | - | No |
| FF-07 | Contract Security Receipt | Yes (Receipt) | Security Reg | Issue receipt | Yes | - |
| FF-08 | Contract Security Return | Yes (Payment) | Update status | Return receipt | - | Yes |
| FF-09 | Withheld Tax Recognition | No direct | WHT Register | Tax cert | Yes | - |
| FF-10 | Withheld Tax Remittance | Yes (Payment) | Update status | PND forms | - | Yes |
| FF-11 | Official Advance Disburse | **No** | Doc Substitute | Contract | No | No |
| FF-12 | Advance Settlement-Expense | Yes (Payment) | Update + Expense | Receipts | - | Yes |
| FF-13 | Advance Cash Return | **No** | Update Doc Sub | No receipt | No | No |
| FF-14 | Position Transfer | **No** | Position Report | Transfer slip | No | No |

*State income appears in Section 3 but flagged separately from usable funds

---

## 10. Implementation Recommendations

### 10.1 System Architecture

**Three-Tier Design:**
1. **Presentation Layer:** Interactive sheets (current HTML interface)
2. **Business Logic Layer:** Transaction validation, fund-flow processing, control rules
3. **Data Layer:** Relational database with all registers and books

**Key Components:**
- **Transaction Engine:** Processes all 14 fund-flow patterns
- **Control Engine:** Enforces blocking rules, reconciliation, alerts
- **Register Manager:** Maintains all required registers per regulations
- **Report Generator:** Produces required reports for OBEC and audits

### 10.2 Critical Features

**Must-Have Features:**
1. **Advance Blocking:** Prevent multiple active advances per borrower
2. **Daily Reconciliation:** Auto-calculate variance and force investigation
3. **State Income Alerts:** Auto-remind remittance deadlines
4. **WHT Deadline Tracking:** Alert before submission deadline
5. **Sequential Integrity:** Prevent out-of-order entries
6. **Audit Trail:** Complete history of all transactions (no deletion, only void)

**User Interface Requirements:**
- Real-time balance display by fund type
- Color-coded alerts for deadlines and violations
- One-click reconciliation reports
- Mobile-responsive for field use

### 10.3 Migration Strategy

**Phase 1: Core Transactions (2 months)**
- Implement FF-03, FF-04 (80% of daily transactions)
- Basic cash book and fund registers
- Daily position report

**Phase 2: Compliance (1 month)**
- Add FF-05, FF-06 (state income)
- Add FF-09, FF-10 (withheld tax)
- Implement deadline alerts

**Phase 3: Advanced (1 month)**
- Add FF-11, FF-12, FF-13 (advances)
- Add FF-07, FF-08 (security deposits)
- Implement blocking rules

**Phase 4: Integration (1 month)**
- Add FF-01, FF-02, FF-14
- Connect all components
- Full audit trail

---

## 11. Conclusion

This blueprint provides complete technical specifications for implementing a compliant accounting system for educational institutions. The 14 fund-flow patterns cover all financial transactions required by Ministry of Finance regulations and OBEC guidelines.

**Key Success Factors:**
- Strict adherence to fund-flow rules (especially FF-11, FF-13 - no cash book entry)
- Daily reconciliation without exception
- Blocking mechanism for advances (prevent multiple outstanding)
- Timely remittances (state income, withheld tax)
- Complete audit trail

**Next Steps:**
1. Review and approve this blueprint with stakeholders
2. Select development technology stack
3. Begin Phase 1 implementation
4. Conduct user acceptance testing with actual school data
5. Deploy with parallel run period (manual + system for 1 month)
6. Full cutover after validation

---

**Document Control:**
- Version: 1.0
- Date: August 11, 2026
- Author: System Architect
- Status: Draft for Review
- Next Review: Upon stakeholder feedback
