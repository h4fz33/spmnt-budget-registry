# Thai Educational Budget Registry System - Application Blueprint

## Executive Summary

A comprehensive financial accounting and budget management system for Thai educational institutions (สถานศึกษา) under the Secondary Educational Service Area Office (SESAO) Narathiwat. The system implements the accounting manual guidelines (คู่มือการบัญชีสำหรับหน่วยงานย่อย พ.ศ. 2515) for subsidiary units.

---

## 1. Domain Analysis

### 1.1 Core Business Context

**Target Users:**
- Educational institution accountants and finance officers
- School administrators
- SESAO financial auditors and supervisors
- School directors requiring financial oversight

**Primary Functions:**
- Record all financial transactions (receipts and payments)
- Maintain cash books and control registers
- Generate financial reports (daily, monthly, annual)
- Track three fund types: Budget, State Revenue, Non-Budget
- Ensure compliance with Thai government accounting standards

### 1.2 Fund Types (ประเภทเงิน)

#### A. Budget Funds (เงินงบประมาณ)
Money allocated through annual government budget appropriation acts.

**Sub-categories:**
1. Personnel Budget (งบบุคลากร)
2. Operating Budget (งบดำเนินงาน)
3. Investment Budget (งบลงทุน)
4. Subsidy Budget (งบเงินอุดหนุน) - General and Specific
5. Other Expenditures (งบรายจ่ายอื่น)

**Key Characteristic:** Schools request disbursement through SESAO but typically don't receive cash directly - payments go to creditors.

#### B. State Revenue (เงินรายได้แผ่นดิน)
Government revenue collected or received by institutions.

**Examples:**
- Sales of damaged old items purchased with budget funds
- Previous year surplus returns
- Interest from subsidy savings accounts

#### C. Non-Budget Funds (เงินนอกงบประมาณ)
Extra-budgetary funds schools can collect and spend without treasury remittance.

**Sub-types:**
1. **School Revenue (เงินรายได้สถานศึกษา)**
   - Rental income
   - Service fees
   - Donations with/without specific purposes
   
2. **Special Purpose Funds:**
   - Scout/Girl Scout/Red Cross funds
   - Education Equality Fund (EEF - กสศ.)
   
3. **Temporary Holdings:**
   - Contract deposits
   - Withholding tax

---

## 2. System Architecture

### 2.1 Technology Stack

**Frontend:**
- **Framework:** Next.js 14 (App Router)
- **UI Components:** shadcn/ui with @base-ui/react
- **Styling:** Tailwind CSS v4 with OKLCH color system
- **Icons:** lucide-react
- **Fonts:** Sarabun & Noto Sans Thai Looped (for Thai language support)

**State Management:**
- React Context for global state
- Server Components for data fetching
- Client Components for interactivity

**Data Layer:**
- **Option 1 (Recommended):** PostgreSQL with Prisma ORM
- **Option 2:** SQLite with Prisma (for standalone deployment)
- **Option 3:** Supabase (PostgreSQL + Auth + Real-time)

**Development Tools:**
- ESLint for code quality
- PostCSS for CSS processing
- Class Variance Authority for component variants

### 2.2 Application Structure

```
spmnt-budget-registry/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes
│   │   ├── (dashboard)/         # Main application
│   │   │   ├── transactions/    # Receipt & Payment entry
│   │   │   ├── cash-book/       # Cash book views
│   │   │   ├── registers/       # Control registers
│   │   │   ├── reports/         # Report generation
│   │   │   └── settings/        # Configuration
│   │   ├── api/                 # API routes
│   │   └── layout.js
│   ├── components/
│   │   ├── ui/                  # shadcn components (existing)
│   │   ├── features/            # Feature-specific components
│   │   │   ├── transactions/
│   │   │   ├── cash-book/
│   │   │   ├── registers/
│   │   │   └── reports/
│   │   └── layouts/             # Layout components
│   ├── lib/
│   │   ├── db/                  # Database client & schema
│   │   ├── validations/         # Zod schemas
│   │   ├── accounting/          # Business logic
│   │   └── utils.js             # Utilities (existing)
│   ├── hooks/                   # Custom React hooks
│   └── types/                   # TypeScript definitions (if migrating)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── public/
└── reseach/                     # Documentation (existing)
```

---

## 3. Data Model

### 3.1 Core Entities

#### **Organizations (หน่วยงาน)**
```
- id
- code (รหัสโรงเรียน)
- name_th
- name_en
- sesao_region (เขตพื้นที่)
- address
- phone
- created_at
- updated_at
```

#### **Fiscal Years (ปีงบประมาณ)**
```
- id
- year (e.g., 2568)
- start_date (Oct 1)
- end_date (Sep 30)
- status (active/closed)
```

#### **Fund Types (ประเภทเงิน)**
```
- id
- code (BUDGET/STATE_REVENUE/NON_BUDGET)
- name_th
- name_en
- parent_id (for sub-categories)
- requires_register (boolean)
```

#### **Transactions (รายการเงิน)**
```
- id
- transaction_date
- transaction_number (เลขที่)
- type (RECEIPT/PAYMENT)
- fund_type_id
- amount
- description
- payee_payer (ผู้รับ/ผู้จ่าย)
- evidence_number (เลขที่หลักฐาน)
- organization_id
- fiscal_year_id
- created_by
- created_at
- updated_at
- void (boolean)
- void_reason
```

#### **Cash Book Entries (สมุดเงินสด)**
```
- id
- transaction_id
- entry_date
- debit_amount
- credit_amount
- balance
- fund_type_id
- account_code
- description
- fiscal_year_id
```

#### **Control Registers (ทะเบียนคุม)**
```
- id
- register_type (BUDGET/STATE_REVENUE/NON_BUDGET/SCHOOL_REVENUE)
- fund_type_id
- transaction_id
- receipt_amount
- payment_amount
- balance
- fiscal_year_id
- month
- remarks
```

#### **Daily Balance Reports (รายงานเงินคงเหลือประจำวัน)**
```
- id
- report_date
- fund_type_id
- opening_balance
- total_receipts
- total_payments
- closing_balance
- organization_id
- fiscal_year_id
- created_by
- created_at
```

#### **Users (ผู้ใช้งาน)**
```
- id
- username
- password_hash
- full_name_th
- full_name_en
- position (ตำแหน่ง)
- role (ADMIN/ACCOUNTANT/VIEWER)
- organization_id
- active (boolean)
- last_login
```

### 3.2 Entity Relationships

```
Organizations 1 ──< * Transactions
Organizations 1 ──< * Users
Fiscal_Years 1 ──< * Transactions
Fiscal_Years 1 ──< * Cash_Book_Entries
Fund_Types 1 ──< * Transactions
Fund_Types 1 ──< * Cash_Book_Entries
Fund_Types 1 ──< * Control_Registers
Transactions 1 ──< 1..* Cash_Book_Entries (double-entry)
Transactions 1 ──< 1..* Control_Registers
```

---

## 4. Core Features & User Flows

### 4.1 Transaction Recording

#### Receipt Entry (การรับเงิน)
1. Select fund type (งบประมาณ/รายได้แผ่นดิน/นอกงบประมาณ)
2. Enter receipt details:
   - Date
   - Amount
   - Payer name (ผู้ชำระ)
   - Description/Purpose
   - Receipt evidence number
3. System generates:
   - Transaction record
   - Cash book debit entry
   - Control register entry
   - Updates daily balance

#### Payment Entry (การจ่ายเงิน)
1. Select fund type
2. Enter payment details:
   - Date
   - Amount
   - Payee name (ผู้รับเงิน)
   - Description/Purpose
   - Payment voucher number
3. System generates:
   - Transaction record
   - Cash book credit entry
   - Control register entry
   - Updates daily balance

### 4.2 Cash Book (สมุดเงินสด)

**Views:**
- Chronological listing (all funds mixed)
- By fund type (filtered view)
- Date range selection
- Running balance calculation

**Features:**
- Multi-column layout showing:
  - Date | Document No. | Description | Debit | Credit | Balance
- Fund type indicator
- Void transaction marking
- Print/Export to PDF

### 4.3 Control Registers (ทะเบียนคุม)

#### Budget Fund Register (ทะเบียนคุมเงินงบประมาณ)
- Track disbursements requested through SESAO
- Monitor allocation vs. spending
- Sub-divided by budget category

#### State Revenue Register (ทะเบียนคุมเงินรายได้แผ่นดิน)
- Track collections
- Remittance tracking to treasury

#### Non-Budget Registers (ทะเบียนคุมเงินนอกงบประมาณ)
- General non-budget register (various types)
- School revenue register (detailed tracking)
- Scout/Special fund registers

**Common Features:**
- Monthly summaries
- Running balances
- Category breakdown
- Fiscal year totals

### 4.4 Reports

#### Daily Reports
- **Daily Balance Report (รายงานเงินคงเหลือประจำวัน)**
  - Generated on any day with transactions
  - Shows opening balance, receipts, payments, closing balance
  - By fund type

#### Monthly Reports
- **Fund Type Balance Report (รายงานประเภทเงินคงเหลือ)**
  - All fund types consolidated
  - Monthly closing balances
  - Generated at month-end

#### Annual Reports
- **School Revenue Annual Report (รายงานการรับ-จ่ายเงินรายได้สถานศึกษา)**
  - Full fiscal year summary
  - Generated at fiscal year-end (Sep 30)
  - Detailed breakdown by revenue/expense category

---

## 5. UI/UX Design Principles

### 5.1 Visual Design Language

**Color Palette:**
Following the design sensibility with stepped tonal surfaces:
- **Surfaces:** Deep near-black layers (#05070C → #161D2B)
- **Accent:** Blue/cyan for financial data (#38BDF8)
- **Supporting:** Emerald for success states (#6EE7B7)
- **Warning:** Amber for alerts (#E9A568)

**Typography:**
- **Body Text:** Sarabun (Thai-optimized, readable)
- **Headings:** Noto Sans Thai Looped (distinctive, formal)
- Fluid type scale with `clamp()` functions
- Generous line-height for Thai text (1.7-1.8)

**Layout:**
- Grid-first approach (CSS Grid for page structure)
- Fully rounded components (999px pills, 50% circles)
- Token-based spacing and radii
- Responsive breakpoints for mobile/tablet/desktop

### 5.2 Navigation Structure

#### Primary Navigation (Sidebar)
```
📊 Dashboard
   └─ Overview (balance summary, recent transactions)

💰 Transactions
   ├─ New Receipt
   ├─ New Payment
   └─ Transaction History

📖 Cash Book
   ├─ View Cash Book
   └─ Print Cash Book

📋 Control Registers
   ├─ Budget Funds
   ├─ State Revenue
   ├─ Non-Budget Funds
   └─ School Revenue

📈 Reports
   ├─ Daily Balance
   ├─ Monthly Summary
   ├─ Annual Report
   └─ Custom Reports

⚙️ Settings
   ├─ Fiscal Year Management
   ├─ Fund Type Configuration
   ├─ User Management
   └─ Organization Profile
```

### 5.3 Key UI Components

#### Transaction Form
- Clean, stepped form with validation
- Date picker (Thai Buddhist calendar + Gregorian)
- Amount input with comma formatting
- Auto-complete for frequent payees/payers
- Evidence number tracking
- Real-time balance preview

#### Data Tables
- Sortable columns
- In-line search/filter
- Pagination with row count options
- Row selection for bulk actions
- Export options (PDF, Excel, CSV)
- Column visibility toggle

#### Dashboard Cards
- Current balance by fund type (prominent display)
- Recent transactions (last 10)
- Pending items requiring action
- Quick stats (monthly totals, year-to-date)

#### Report Viewer
- Print preview mode
- PDF download
- Thai date formatting throughout
- Organization header/footer on prints
- Digital signature area

---

## 6. Business Logic & Rules

### 6.1 Double-Entry Accounting

Every transaction creates balanced entries:
- **Receipt:** Debit Cash / Credit Revenue
- **Payment:** Debit Expense / Credit Cash

### 6.2 Fiscal Year Management

- Thai fiscal year: October 1 - September 30
- Year display: Buddhist Era (พ.ศ.) e.g., 2568
- Cannot record transactions outside active fiscal year
- Year-end closing process locks historical data

### 6.3 Transaction Validation

**Receipt Validations:**
- Date cannot be future date
- Amount must be positive
- Fund type must be active
- Receipt number must be unique within fiscal year

**Payment Validations:**
- Same as receipts, plus:
- Payment amount cannot exceed available fund balance
- Requires approval for amounts > threshold (configurable)

### 6.4 Void/Correction Process

- Transactions cannot be deleted (audit trail)
- Void transaction creates offsetting entry
- Requires reason/justification
- Void entries clearly marked in all views
- Original transaction reference maintained

### 6.5 Report Generation Rules

**Daily Balance:**
- Auto-generated on transaction save
- One report per day per fund type
- Can be manually regenerated

**Monthly Close:**
- Triggered on first day of next month or manually
- Calculates and locks monthly totals
- Prevents backdated entries after closing

**Annual Close:**
- Performed after September 30
- Generates comprehensive annual report
- Transfers closing balances to next year's opening
- Archives fiscal year data

---

## 7. Security & Access Control

### 7.1 Role-Based Access Control (RBAC)

#### Administrator
- Full system access
- User management
- Fiscal year management
- Void transactions
- Generate all reports

#### Accountant
- Record transactions (receipts/payments)
- View cash book and registers
- Generate routine reports
- Cannot void transactions without approval
- Cannot modify closed periods

#### Viewer
- Read-only access to all data
- Generate and export reports
- Cannot create/modify transactions
- Useful for school directors and auditors

### 7.2 Audit Trail

- All transactions logged with creator ID and timestamp
- Change history for edits (before/after)
- Login/logout tracking
- Report generation logs
- Void transaction reasoning stored

### 7.3 Data Backup & Recovery

- Daily automated backups
- Export full database (JSON/SQL)
- Import from backup
- Point-in-time recovery capability

---

## 8. Implementation Phases

### Phase 1: Core Foundation (Week 1-2) ✓ TO BE BUILT NOW
**Objective:** Create the MVP with essential transaction recording

**Deliverables:**
1. Database schema & migrations
2. Basic UI shell with navigation
3. Transaction recording forms (Receipt/Payment)
4. Simple cash book view
5. Basic authentication

**Technical Tasks:**
- Set up Prisma with PostgreSQL/SQLite
- Create database models
- Build form components with validation
- Implement transaction CRUD API routes
- Create basic dashboard layout with sidebar

**Success Criteria:**
- Can record receipts and payments
- Transactions appear in cash book
- Balances calculate correctly

### Phase 2: Registers & Basic Reports (Week 3-4)
**Objective:** Implement control registers and daily reporting

**Deliverables:**
1. Control register views for all fund types
2. Daily balance report generation
3. Transaction search and filtering
4. Void transaction functionality

**Technical Tasks:**
- Build register calculation logic
- Create report generation engine
- Implement PDF export
- Add transaction void workflow
- Create data table components with filters

**Success Criteria:**
- Registers update automatically with transactions
- Daily balance reports generate accurately
- Can void transactions with audit trail

### Phase 3: Advanced Reporting (Week 5-6)
**Objective:** Complete reporting suite

**Deliverables:**
1. Monthly summary reports
2. Annual report generation
3. Custom report builder
4. Export to Excel/CSV
5. Print templates

**Technical Tasks:**
- Build report aggregation queries
- Create Thai date formatting utilities
- Implement print stylesheet
- Add Excel export functionality
- Design professional report templates

**Success Criteria:**
- All required reports generate correctly
- Thai formatting throughout
- Print-ready output

### Phase 4: User Management & Settings (Week 7)
**Objective:** Multi-user support and configuration

**Deliverables:**
1. User management interface
2. Role-based permissions
3. Fiscal year configuration
4. Organization settings
5. Backup/restore functionality

**Technical Tasks:**
- Implement RBAC middleware
- Create user CRUD pages
- Build fiscal year management
- Add system settings storage
- Implement backup/export features

**Success Criteria:**
- Multiple users can work simultaneously
- Permissions enforce correctly
- Fiscal years manage properly

### Phase 5: Polish & Deploy (Week 8)
**Objective:** Production-ready application

**Deliverables:**
1. Performance optimization
2. Error handling & validation improvements
3. Help documentation
4. User training materials
5. Deployment package

**Technical Tasks:**
- Optimize database queries
- Add comprehensive error messages
- Create user guide (Thai language)
- Set up production environment
- Perform load testing

**Success Criteria:**
- Application runs smoothly
- Users can self-onboard with documentation
- Ready for real-world use

---

## 9. Technical Considerations

### 9.1 Database Choice

**Recommendation: PostgreSQL with Prisma**

**Rationale:**
- Robust transaction support (ACID compliance critical for accounting)
- JSON columns for flexible metadata
- Full-text search in Thai
- Proven scalability
- Prisma provides excellent DX with type-safe queries

**Alternative: SQLite for Standalone**
- If schools need offline-first capability
- Single-file database for easy backup
- Trade-off: limited concurrent users

### 9.2 Thai Language Support

**Critical Requirements:**
- UTF-8 encoding throughout
- Thai fonts (already configured: Sarabun, Noto Sans Thai)
- Buddhist Era (พ.ศ.) date calculations
- Number formatting with Thai numerals option
- Right-to-left number alignment in tables
- Thai language validation messages

**Date Handling:**
```javascript
// Buddhist Era = Gregorian + 543
const buddhistYear = new Date().getFullYear() + 543;
// Format: 15 ธันวาคม 2568
```

### 9.3 Performance Optimization

**Database:**
- Index on: transaction_date, organization_id, fiscal_year_id, fund_type_id
- Materialized views for report aggregations
- Partition large tables by fiscal year

**Frontend:**
- Server Components for data-heavy pages
- React Suspense for loading states
- Virtualized tables for large datasets
- Memoization for expensive calculations

**Caching Strategy:**
- Report results cached for 5 minutes
- Balance calculations cached until next transaction
- Static fiscal year data cached indefinitely

### 9.4 Mobile Responsiveness

While primarily a desktop application, basic mobile support:
- Responsive sidebar (drawer on mobile)
- Touch-friendly form controls
- Readable text sizes
- Horizontal scroll for wide tables
- Mobile-optimized transaction entry forms

---

## 10. Deployment & Maintenance

### 10.1 Deployment Options

**Option A: Cloud Hosting (Vercel + Supabase)**
- Deploy Next.js to Vercel
- PostgreSQL on Supabase
- Automatic HTTPS
- Continuous deployment from Git
- Scalable, managed infrastructure

**Option B: On-Premise (SESAO Server)**
- Docker container deployment
- PostgreSQL in Docker
- Nginx reverse proxy
- Manual updates via Docker Compose
- Full data control

**Option C: Hybrid (VPS)**
- DigitalOcean/AWS Lightsail
- Docker Compose setup
- More control than Option A
- Lower cost than dedicated hosting
- Requires basic DevOps knowledge

### 10.2 Backup Strategy

**Automated Daily Backups:**
- Database dump at 2 AM daily
- Retain last 30 days
- Store in separate location/bucket

**Manual Backups:**
- Before fiscal year close
- Before major updates
- On-demand via admin interface

### 10.3 Monitoring

**Application:**
- Error logging (Sentry or similar)
- Performance monitoring
- User activity logs

**Database:**
- Connection pool monitoring
- Slow query logging
- Disk space alerts

---

## 11. Success Metrics

### 11.1 System Adoption
- Number of active users
- Daily transaction volume
- Report generation frequency

### 11.2 Accuracy
- Zero balance discrepancies
- Successful fiscal year closes
- Audit pass rate

### 11.3 Efficiency
- Average transaction entry time < 2 minutes
- Report generation time < 5 seconds
- Page load time < 1 second

### 11.4 User Satisfaction
- User feedback surveys
- Support ticket volume
- Feature request tracking

---

## 12. Future Enhancements (Post-Launch)

### Phase 6+: Advanced Features

1. **Multi-School Management**
   - SESAO-level dashboard
   - Consolidated reporting across schools
   - Comparative analytics

2. **Budget Planning**
   - Annual budget proposal module
   - Allocation tracking
   - Variance analysis

3. **Integration**
   - Import bank statements
   - Export to government systems
   - API for third-party tools

4. **Advanced Analytics**
   - Spending trends
   - Fund utilization rates
   - Predictive analytics

5. **Mobile App**
   - Native iOS/Android apps
   - Receipt photo capture
   - Push notifications

6. **Workflow Automation**
   - Approval workflows
   - Automated reminders
   - Email notifications

---

## 13. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss | High | Low | Automated backups, transaction logs |
| Calculation errors | High | Medium | Comprehensive testing, double-entry validation |
| User adoption resistance | Medium | Medium | Training, intuitive UI, support materials |
| Performance issues | Medium | Low | Optimization, caching, scalable infrastructure |
| Security breaches | High | Low | RBAC, audit logs, secure hosting |
| Regulatory changes | Medium | Medium | Modular design, configurable rules |

---

## Conclusion

This blueprint provides a comprehensive foundation for building a robust, user-friendly budget registry system tailored to Thai educational institutions. The phased approach ensures early delivery of core functionality while allowing for iterative enhancement.

**Next Step:** Proceed to Phase 1 implementation - building the core transaction recording system and database foundation.

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Author:** Claude Code  
**Status:** READY FOR PHASE 1 IMPLEMENTATION
