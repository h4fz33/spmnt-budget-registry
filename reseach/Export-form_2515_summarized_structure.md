# Export-form_2515 — Summarized Row/Column Structure

## Source

**File:** `Export-form_2515.pdf`  
**Document:** แนวการประเมินผลการปฏิบัติงานด้านการเงิน การบัญชีของสถานศึกษาที่ปฏิบัติตามคู่มือการบัญชีสำหรับหน่วยงานย่อย พ.ศ. 2515  
**Scope:** 16 PDF pages; page 1 is the index and pages 2–16 contain 15 form specimens.

This document preserves the actual structural organization of each source form, including form-level fields, table columns, grouped columns, hierarchical rows, totals, and signature/approval sections.

---

## Page 1 — Index / Form List

**Type:** Index, not a data-entry form.

| # | Form | Source page |
|---|---|---:|
| 1 | สมุดเงินสด | 15 |
| 2 | ทะเบียนคุมเงินรายได้แผ่นดิน | 16 |
| 3 | ทะเบียนคุมเงินนอกงบประมาณ | 17 |
| 4 | ทะเบียนคุมเงินนอกงบประมาณ ประเภทเงินรายได้สถานศึกษา | 18 |
| 5 | ทะเบียนคุมหลักฐานขอเบิก | 19 |
| 6 | ทะเบียนคุมเอกสารแทนตัวเงิน | 20 |
| 7 | สมุดคู่ฝาก | 21 |
| 8 | ทะเบียนเงินฝากธนาคารประเภทกระแสรายวัน | 22 |
| 9 | ทะเบียนคุมรายรับเงินรายได้สถานศึกษา | 23 |
| 10 | รายงานเงินคงเหลือประจำวัน | 24 |
| 11 | รายงานประเภทเงินคงเหลือ | 25 |
| 12 | งบเทียบยอดเงินฝากธนาคาร | 26 |
| 13 | รายงานการรับ - จ่ายเงินรายได้สถานศึกษา | 27 |
| 14 | ใบนำฝาก | 28 |
| 15 | ใบเบิกถอน | 29 |

---

# Page 2 — สมุดเงินสด

**Form type:** Accounting ledger

### Left section — รายการรับ

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
ที่เอกสาร
รายการรับ
เดบิต
  └─ เงินสด
เครดิต
  ├─ เงินงบประมาณ
  ├─ เงินรายได้แผ่นดิน
  └─ เงินนอกงบประมาณ
```

### Right section — รายการจ่าย

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
ที่เอกสาร
รายการจ่าย
เครดิต
  └─ เงินสด
เดบิต
  ├─ เงินงบประมาณ
  ├─ เงินรายได้แผ่นดิน
  └─ เงินนอกงบประมาณ
```

**Structural note:** One form contains two parallel ledger sections: receipt and payment.

---

# Page 3 — ทะเบียนคุมเงินรายได้แผ่นดิน

**Form type:** Revenue-control ledger

### Columns

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
ที่เอกสาร
รายการ
ประเภทเงินรายได้แผ่นดิน
  ├─ [sub-column — source label not specified]
  ├─ [sub-column — source label not specified]
  ├─ ...
  └─ [multiple category columns]
รวม
```

**Structural note:** The source visually shows a grouped heading `ประเภทเงินรายได้แผ่นดิน` with multiple internal columns. Individual sub-column labels should not be invented.

---

# Page 4 — ทะเบียนคุมเงินนอกงบประมาณ

**Form type:** Extrabudgetary fund ledger

### Form-level field

```text
ประเภท ............................................
พ.ศ. ............
```

### Columns

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
ที่เอกสาร
รายการ
รับ
จ่าย
คงเหลือ
```

### Body

```text
[transaction row]
[transaction row]
[transaction row]
...
```

`ประเภท` is a form-level classification/header field, not a predefined transaction category.

---

# Page 5 — ทะเบียนคุมเงินนอกงบประมาณ ประเภทเงินรายได้สถานศึกษา

**Form type:** School-revenue extrabudgetary ledger

### Columns

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
ที่เอกสาร
รายการ
รับ
จ่าย
คงเหลือ

ประเภทการจ่าย
  ├─ ค่าจ้างชั่วคราว
  ├─ ค่าตอบแทน
  ├─ ค่าใช้สอย
  ├─ ค่าวัสดุ
  ├─ ครุภัณฑ์
  ├─ ค่าที่ดินและสิ่งก่อสร้าง
  ├─ เงินอุดหนุน
  └─ รายจ่ายอื่น
```

**Structural note:** `ประเภทการจ่าย` is a grouped horizontal column structure. These are columns, not hierarchical rows.

---

# Page 6 — ทะเบียนคุมหลักฐานขอเบิก

**Form type:** Supporting-document withdrawal/payment-control register

### Columns

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
เจ้าหนี้หรือผู้ขอเบิก
หมวดรายจ่าย
จำนวนเงิน
ลายมือชื่อผู้รับ
เบิกแล้วตาม
  └─ ใบเบิกเงินเพื่อจ่ายในราชการที่
หมายเหตุ
```

### Body

```text
[claim/payment evidence row]
[claim/payment evidence row]
...
```

**Structural note:** `เบิกแล้วตาม ใบเบิกเงินเพื่อจ่ายในราชการที่` is one logical field group.

---

# Page 7 — ทะเบียนคุมเอกสารแทนตัวเงิน

**Form type:** Substitute-for-cash document register

### Columns

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
ประเภท
เลขที่
จำนวนเงิน
วันที่เปลี่ยนสภาพ
หมายเหตุ
```

### Body

```text
[document row]
[document row]
...
```

---

# Page 8 — สมุดคู่ฝาก

**Form type:** Deposit/passbook ledger

### Columns

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่

ที่ใบนำฝาก
หรือที่ใบเบิกถอน

จำนวนเงิน
  ├─ รับ
  ├─ จ่าย
  └─ คงเหลือ

ลายมือชื่อผู้รับฝาก

ลายมือชื่อผู้นำฝาก
หรือผู้เบิกถอน

หมายเหตุ
```

**Structural note:** `ที่ใบนำฝาก หรือที่ใบเบิกถอน` is one reference field covering either document type.

---

# Page 9 — ทะเบียนเงินฝากธนาคารประเภทกระแสรายวัน

**Form type:** Current-account bank ledger

### Form-level fields

```text
ธนาคาร ....................................
สาขา .......................................
เลขที่บัญชี ...............................
พ.ศ. .......................................
```

### Columns

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
ที่เอกสาร
รายการ

จำนวนเงิน
  ├─ รับ
  ├─ จ่าย
  └─ คงเหลือ

ลายมือชื่อหัวหน้าหน่วยงานย่อย
```

---

# Page 10 — ทะเบียนคุมรายรับเงินรายได้สถานศึกษา

**Form type:** School-revenue income-control register

### Columns

```text
พ.ศ.
  ├─ เดือน
  └─ วันที่
ที่เอกสาร
รายการ

ผลประโยชน์จากที่ราชพัสดุ
เบี้ยปรับลาศึกษา
เบี้ยปรับซื้อ/จ้าง

เงินที่มีผู้มอบให้
  ├─ ระบุวัตถุประสงค์
  └─ ระบุไม่ชัดแจ้ง

เงินผลประโยชน์อื่น
  ├─ เงินระดม/เงิน บกศ.
  └─ รายได้อื่น ๆ

รวม
หมายเหตุ
```

**Structural note:** `เงินที่มีผู้มอบให้` and `เงินผลประโยชน์อื่น` are grouped columns with subcolumns.

---

# Page 11 — รายงานเงินคงเหลือประจำวัน

**Form type:** Daily remaining-funds report

### Form-level fields

```text
ส่วนราชการ
อำเภอ
ประจำวันที่ ........ เดือน ........ พ.ศ. ........
```

### Main table columns

```text
รายงาน
จำนวนเงิน
หมายเหตุ
```

### Fixed rows

```text
เงินสดในมือ

เช็ค
  └─ จำนวน .... ฉบับ

ธนาณัติ
  └─ จำนวน .... ฉบับ

ใบสำคัญรองจ่าย
  └─ จำนวน .... ฉบับ

สัญญารับรองการยืมเงิน
  └─ จำนวน .... ฉบับ

ใบเบิกเงินเพื่อจ่ายในราชการ
  └─ จำนวน .... ฉบับ

สมุดคู่ฝาก
  └─ จำนวน .... เล่ม

รายการเพิ่มเติม
  └─ [blank repeatable rows]
```

### Footer / verification

```text
จำนวน (ตัวอักษร)

ลงชื่อ ................................
หัวหน้าส่วนราชการ

กรรมการเก็บรักษาเงิน
  ├─ กรรมการ
  ├─ กรรมการ
  └─ กรรมการ

ข้าพเจ้า/ผู้รับมอบหมาย
ได้รับเงินและเอกสารแทนตัวเงิน...

ลงชื่อ ผู้รับเงิน

ลงชื่อ หัวหน้าส่วนราชการผู้มอบหมาย
```

**Structural note:** This is a compound report: table + verification/custody + signatures.

---

# Page 12 — รายงานประเภทเงินคงเหลือ

**Form type:** Remaining-fund classification report

### Main columns

```text
รายการ
จำนวนเงิน
```

### Row hierarchy

#### เงินงบประมาณ

```text
เงินงบประมาณ

  ใบเบิกเงินเพื่อจ่ายในราชการที่ .......... หมวด ..........
  [repeatable rows]

รวมเงินงบประมาณคงเหลือ
```

#### เงินรายได้แผ่นดิน

```text
เงินรายได้แผ่นดิน

  ประเภท ................................
  [repeatable rows]

รวมเงินรายได้แผ่นดินที่จัดเก็บคงเหลือ
```

#### เงินนอกงบประมาณ

```text
เงินนอกงบประมาณ

  ประเภท ................................
  [repeatable rows]

รวมเงินนอกงบประมาณคงเหลือ
```

#### Grand total

```text
รวมทั้งสิ้น
```

### Footer

```text
ลงชื่อ ................................
หัวหน้าหน่วยงานย่อย

วันที่ ................................
```

**Structural note:** The three financial categories are row groups, each with a subtotal.

---

# Page 13 — งบเทียบยอดเงินฝากธนาคาร

**Form type:** Bank reconciliation statement

### Form-level fields

```text
หัวหน้าสถานศึกษา
โรงเรียน ....................................
สังกัด .......................................
ชื่อบัญชี ...................................
ธนาคาร .......................................
เลขที่บัญชี ..............................
ณ วันที่ .....................................
```

### Reconciliation structure

```text
ยอดคงเหลือตามรายงานธนาคาร (Bank Statement)

หัก
  (1) เช็คสั่งจ่ายที่ยังไม่นำไปขึ้นเงินที่ธนาคาร
      1. เช็คเลขที่ ................. จำนวนเงิน .........
      2. เช็คเลขที่ ................. จำนวนเงิน .........
      3. เช็คเลขที่ ................. จำนวนเงิน .........

  (2) เงินที่ สพฐ./สพท. โอนเข้าบัญชีแต่ยังไม่ได้ลงรับ
      1. รายการ .................... จำนวนเงิน .........
      2. รายการ .................... จำนวนเงิน .........
      3. รายการ .................... จำนวนเงิน .........

รวมยอด

บวก
  [รายการปรับปรุง — blank]
  [รายการปรับปรุง — blank]

ยอดคงเหลือตามรายงานธนาคารหลังปรับปรุง

ยอดคงเหลือตามทะเบียนเงินฝากธนาคารประเภทกระแสรายวัน

ลงชื่อ ....................................
(...........................................)
ตำแหน่ง ...................................
```

**Structural note:** This is a reconciliation calculation structure, not a normal transaction ledger. `หัก` and `บวก` are semantic calculation groups.

---

# Page 14 — รายงานการรับ - จ่ายเงินรายได้สถานศึกษา

**Form type:** Annual school-revenue income/expenditure report

### Form-level fields

```text
โรงเรียน ....................................
สังกัดสำนักงานเขตพื้นที่การศึกษา
ณ วันที่ ........ เดือน ........ พ.ศ. ........
```

### Main columns

```text
รายการ
จำนวนเงิน
```

### Opening balance

```text
ยอดยกมาจากปีงบประมาณที่ผ่านมา
```

### รายรับ hierarchy

```text
รายรับ

1. ผลประโยชน์จากที่ราชพัสดุ

2. เบี้ยปรับจากการผิดสัญญาลาศึกษา

3. เบี้ยปรับจากการผิดสัญญาการซื้อทรัพย์สิน
   หรือจ้างทำของด้วยเงินงบประมาณ

4. เงินที่มีผู้มอบให้ โดย
   4.1 ระบุวัตถุประสงค์ชัดแจ้ง
   4.2 ระบุวัตถุประสงค์ไม่ชัดแจ้ง

5. เงินบำรุงการศึกษา

6. ผลประโยชน์อื่น ๆ
   6.1 ................................
   6.2 ................................

รวมรายรับ
```

### รายจ่าย hierarchy

```text
รายจ่าย

1. งบบุคลากร
   1.1 รายการค่าจ้างชั่วคราว

2. งบดำเนินงาน
   2.1 ค่าตอบแทน
   2.2 ค่าใช้สอย
   2.3 ค่าวัสดุ
   2.4 ค่าสาธารณูปโภค

3. งบลงทุน
   3.1 ค่าครุภัณฑ์
   3.2 ค่าที่ดินและสิ่งก่อสร้าง

4. งบเงินอุดหนุน

5. อื่น ๆ
   5.1 ................................
   5.2 ................................

รวมรายจ่าย

ยอดยกไป
```

**Structural note:** The hierarchy here is vertical row hierarchy, unlike the grouped horizontal columns in Pages 5 and 10.

---

# Page 15 — ใบนำฝาก

**Form type:** Deposit slip + receipt

### Header

```text
ส่วนราชการผู้รับฝาก
ที่ผู้รับฝาก

ส่วนราชการผู้นำฝาก
ที่ผู้นำฝาก
```

### Deposit table columns

```text
ประเภทเงิน
รายการ
จำนวนเงิน
```

### Body

```text
[deposit transaction row]
[deposit transaction row]
...
```

### Total

```text
รวมเงิน
(ตัวอักษร)
```

### Depositor section

```text
วันที่
ลายมือชื่อผู้นำฝาก
ตำแหน่ง
```

### Receipt section

```text
ใบรับเงิน

ได้รับเงินตามจำนวนข้างต้นไว้ถูกต้องแล้ว

ลายมือชื่อผู้รับเงิน
วันที่

ลายมือชื่อหัวหน้าส่วนราชการผู้รับฝาก
วันที่
```

**Structural note:** This is a compound document consisting of deposit details and receipt confirmation.

---

# Page 16 — ใบเบิกถอน

**Form type:** Withdrawal request + authorization + receipt

## Section 1 — คำขอถอนเงิน

```text
ชื่อหน่วยงานย่อย
ที่ผู้เบิก
ที่ผู้รับฝาก

ประเภท ....................................

จำนวนเงินที่ขอถอน
  ├─ ☐ เงินสด
  └─ ☐ เช็ค

จำนวนเงิน (ตัวอักษร)

ชื่อผู้รับมอบฉันทะ
ลายมือชื่อผู้เบิก
ลายมือชื่อผู้รับมอบฉันทะ
ตำแหน่ง
ตำแหน่ง
วันที่
```

## Section 2 — คำอนุมัติ

```text
จ่ายให้เป็น
  ├─ ☐ เงินสด
  └─ ☐ เช็คเลขที่ ............ วันที่ ............

ลายมือชื่อผู้อนุมัติ
ตำแหน่ง
หัวหน้าส่วนราชการผู้รับฝาก
```

## Section 3 — ใบรับเงิน

```text
ได้รับเงินตามจำนวนข้างต้นไว้ถูกต้องแล้ว

ลายมือชื่อผู้รับเงิน
ลายมือชื่อผู้จ่ายเงิน
วันที่
```

**Structural note:** The three workflow sections must remain distinct:

```text
คำขอถอนเงิน
      ↓
คำอนุมัติ
      ↓
ใบรับเงิน
```

---

# Codex Categorization Rules

The following rules should be applied when categorizing the extracted structure.

## 1. Treat every page/form independently

Do not assume that the same ordinal position means the same semantic field across forms.

## 2. Do not match by item number

For example:

```text
Page 5 item/column 1
≠
Page 14 item/row 1
```

Semantic meaning must determine equivalence.

## 3. Preserve structural type

Distinguish:

- form-level fields
- table columns
- grouped columns
- column subfields
- fixed rows
- hierarchical rows
- repeatable rows
- subtotal rows
- total rows
- signature sections
- approval sections
- receipt sections
- calculation/reconciliation sections

## 4. Grouped columns ≠ hierarchical rows

### Page 5

```text
ประเภทการจ่าย
 ├─ ค่าจ้างชั่วคราว
 ├─ ค่าตอบแทน
 ├─ ค่าใช้สอย
 └─ ...
```

This is a **horizontal column group**.

### Page 14

```text
รายจ่าย
 ├─ 1. งบบุคลากร
 ├─ 2. งบดำเนินงาน
 │   ├─ 2.1 ค่าตอบแทน
 │   ├─ 2.2 ค่าใช้สอย
 │   └─ ...
 └─ ...
```

This is a **vertical row hierarchy**.

## 5. Do not invent source labels

If a column or row label is visually blank or unspecified, preserve it as:

```text
[source label not specified]
```

Do not infer a category merely from its position.

## 6. Preserve original Thai terminology

The source terminology should be retained as the canonical label.

## 7. Preserve numbering

For example:

```text
4
4.1
4.2
6
6.1
6.2
```

These numbers represent hierarchy and should not be discarded.

## 8. Preserve totals and subtotals

Examples:

```text
รวม
รวมรายรับ
รวมรายจ่าย
รวมเงินงบประมาณคงเหลือ
รวมเงินรายได้แผ่นดินที่จัดเก็บคงเหลือ
รวมเงินนอกงบประมาณคงเหลือ
รวมทั้งสิ้น
ยอดยกไป
```

These are structural nodes, not ordinary transaction fields.

## 9. Preserve blank/repeatable rows

Dotted or blank rows indicate places for repeated/manual entries.

Do not invent semantic names for these rows.

## 10. Do not flatten compound forms

Examples:

```text
Page 15
  ใบนำฝาก
  └─ ใบรับเงิน

Page 16
  คำขอถอนเงิน
  └─ คำอนุมัติ
      └─ ใบรับเงิน
```

These represent distinct workflow sections.

## 11. Do not normalize prematurely

The objective of this extraction is to create a **source structural layer**.

The next categorization step should determine semantic relationships without destroying the original source structure.

---

# Suggested semantic categories for Codex

Codex may classify each extracted node into categories such as:

```text
FORM_METADATA
TABLE_COLUMN
COLUMN_GROUP
COLUMN_SUBFIELD
ROW
ROW_GROUP
ROW_SUBITEM
REPEATABLE_ROW
SUBTOTAL
TOTAL
REFERENCE_FIELD
CALCULATION_FIELD
SIGNATURE_FIELD
APPROVAL_FIELD
RECEIPT_FIELD
CHECKBOX_FIELD
FREE_TEXT_FIELD
DATE_FIELD
DOCUMENT_NUMBER_FIELD
AMOUNT_FIELD
ORGANIZATION_FIELD
ACCOUNT_FIELD
BANK_FIELD
```

These categories are **implementation-oriented classification suggestions**, not labels stated by the source document.
