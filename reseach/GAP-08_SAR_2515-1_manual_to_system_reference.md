# GAP-08 — SAR / แบบ 2515-1 Manual-to-Assessment Reference

## Purpose

เอกสารนี้เป็น implementation/reference artifact สำหรับ GAP-08 เพื่อเชื่อมโยง `manual_2515.md` → การควบคุม/การปฏิบัติงานจริง → แบบ 2515-1 → หลักฐานที่ควรใช้ในการประเมินตนเอง

**ไม่ใช่การสร้างเกณฑ์ใหม่ และไม่กำหนดสูตรคะแนนของ 2515-2**

## 1. Source interpretation

คู่มือกำหนด 10 ประเด็นหลักของการประเมิน และให้สถานศึกษาทำ Self Assessment ปีละ 1 ครั้งเพื่อสอบทานความถูกต้องและปรับปรุงงานอย่างต่อเนื่อง. แบบ 2515-1 เป็นแบบบันทึกผล Self Assessment; 2515-2 เป็นแบบสรุปคะแนน และ 2515-3 เป็นรายงานผล

สำคัญ: แหล่งข้อมูลไม่ได้ระบุว่า SAR ต้องเกิดก่อน “ปิดยอดปีงบประมาณ” โดยตรง แต่กำหนดรอบประจำปีและกำหนดส่งผลประเมินภายในเดือนกรกฎาคม. รายงานรายได้สถานศึกษาประจำปีมี deadline ภายใน 30 วันหลังสิ้นปีงบประมาณ และรายงานการใช้ใบเสร็จภายใน 31 ตุลาคมของปีงบประมาณถัดไป

ดังนั้นระบบควรถือว่า:
- financial records/reports ของปีงบประมาณ = evidence base ที่สะสมตลอดปี
- year-end/post-year-end controls = evidence ตาม deadline ของแต่ละ control
- Annual SAR = annual assessment activity
- submission = annual submission ให้ ESAO/SESAO

## 2. Core workflow

```text
Financial activity during fiscal year
        |
        v
Controlled records + source evidence
        |
        +--> Daily controls / Daily Balance / Daily Inspection
        +--> Monthly reports / reconciliation
        +--> Advance / receipt / payment / receipt-book controls
        +--> Year-end annual reports and controls
        |
        v
Annual Self Assessment
        |
        |-- Form 2515-1: detailed YES/NO + observations
        v
2515-2: scored summary
        v
2515-3: result/report
        v
Submit to ESAO/SESAO
        v
ESAO synthesis / risk assessment / audit planning
```

คู่มือ/คู่มือการประเมินระบุลำดับ 2515-1 → 2515-2 → 2515-3 และการส่งผลให้สำนักงานเขตพื้นที่ฯ ภายในเดือนกรกฎาคม

## 3. Evidence principle

ใช้ evidence 3 แบบ:

- `DERIVED` — ข้อเท็จจริงคำนวณ/ตรวจจาก controlled records
- `DOCUMENTARY` — เอกสารภายนอก/เอกสารลงนามที่ระบบต้องอ้างอิง
- `ATTESTED` — การยืนยันสภาพการปฏิบัติงานที่ระบบพิสูจน์เองไม่ได้

ค่าตอบแบบประเมินควรรองรับ `มี/ใช่`, `ไม่มี/ไม่ใช่`, และ `N/A` เฉพาะเมื่อ source criterion อนุญาต พร้อม note และ evidence reference

**ห้าม** เปลี่ยน missing evidence เป็น `NO` โดยอัตโนมัติ

---

## 4. Semantic linkage: manual → 2515-1

### Dimension 1 — การบริหารเงินของสถานศึกษา

`2515-1: 1.1–1.16`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 1.1 | จัดทำแผนปฏิบัติการประจำปี/โครงการสอดคล้องภารกิจ | Documentary | HIGH |
| 1.2 | แผนสอดคล้องภารกิจ นโยบายและจุดเน้น สพฐ. | Documentary/Attested | HIGH |
| 1.3 | แผนครอบคลุมแหล่งเงินที่ได้รับ/คาดว่าจะได้รับ | Derived + Documentary | HIGH |
| 1.4 | ระบุกิจกรรม วงเงิน แหล่งเงิน ระยะเวลา ผู้รับผิดชอบ | Documentary | HIGH |
| 1.5 | เสนอแผนขอความเห็นชอบคณะกรรมการสถานศึกษา | Documentary | HIGH |
| 1.6 | ครู/บุคลากร/ผอ. มีส่วนร่วมจัดทำแผน | Documentary/Attested | HIGH |
| 1.7 | เผยแพร่ประชาสัมพันธ์แผน | Documentary/Attested | HIGH |
| 1.8 | ดำเนินการตามแผน ภายในวงเงิน/ระยะเวลา | Derived + Documentary | HIGH |
| 1.9 | การปรับ/ยกเลิกแผนได้รับการรายงาน/เห็นชอบตามที่กำหนด | Documentary | HIGH |
| 1.10 | ดำเนินงานครบถ้วนทุกโครงการ/กิจกรรม | Derived + Attested | HIGH |
| 1.11 | มีทะเบียน/เอกสารควบคุมการใช้จ่ายโครงการ/กิจกรรม | Derived | HIGH |
| 1.12 | การใช้จ่ายเป็นไปตามแผน | Derived | HIGH |
| 1.13 | กรณีไม่เป็นไปตามแผน มีการรายงานปัญหา/อุปสรรค | Documentary | HIGH |
| 1.14 | มีการติดตามเร่งรัดอย่างน้อยทุกภาคเรียน | Documentary/Attested | HIGH |
| 1.15 | รายงานผลครบทุกโครงการ/กิจกรรม | Documentary | HIGH |
| 1.16 | ประชาสัมพันธ์รายงานผลให้สาธารณชนทราบ | Documentary/Attested | HIGH |

### Dimension 2 — การควบคุมเงินคงเหลือ

`2515-1: 2.1–2.6`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 2.1 | Daily Balance จัดทำทุกวันที่มีรับ/จ่าย ถูกต้อง เป็นปัจจุบัน และเสนอ ผอ. | Derived + Documentary | HIGH |
| 2.2 | ระบุรายละเอียดเงินสดคงเหลือแต่ละประเภท | Derived | HIGH |
| 2.3 | ยอดตาม Daily Balance ตรงกับตัวเงินและเอกสารแทนตัวเงิน | Derived + Documentary | HIGH |
| 2.4 | ยอด Daily Balance ตรงกับยอดยกไปในสมุดเงินสด | Derived | HIGH |
| 2.5 | ยอดเงินฝากธนาคารสอดคล้องกับรายงาน/ทะเบียนที่เกี่ยวข้อง | Derived | HIGH |
| 2.6 | ยอดเงินฝากส่วนราชการผู้เบิกสอดคล้องกับ Daily Balance | Derived + Documentary | HIGH |

### Dimension 3 — การเก็บรักษาเงิน

`2515-1: 3.1–3.5; 3.4.1–3.4.3`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 3.1 | แต่งตั้งคณะกรรมการเก็บรักษาเงิน | Documentary | HIGH |
| 3.2 | กรรมการปฏิบัติหน้าที่เก็บรักษาเงิน | Documentary/Attested | HIGH |
| 3.3 | การเก็บรักษาเงินสด/เงินฝากเป็นไปตามวงเงินและ control ที่กำหนด | Derived + Documentary | HIGH |
| 3.4.1 | เงินรายได้แผ่นดินที่เก็บเป็นเงินสดไม่เกิน 10,000 บาท | Derived | HIGH |
| 3.4.2 | นำเงินรายได้แผ่นดินส่งคลังอย่างน้อยเดือนละครั้ง | Derived | HIGH |
| 3.4.3 | หากเกิน 10,000 บาท นำส่งไม่เกิน 3 วันทำการถัดไป | Derived | HIGH |
| 3.5 | นำส่งภาษีหัก ณ ที่จ่ายภายในระยะเวลาที่กำหนด | Derived + Documentary | HIGH |

### Dimension 4 — การควบคุมการรับเงิน

`2515-1: 4.1–4.5`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 4.1 | มีคำสั่ง/บันทึกมอบหมายผู้ทำหน้าที่รับจ่ายเงิน | Documentary | HIGH |
| 4.2 | ผู้รับเงินเป็นผู้ได้รับมอบหมาย | Documentary | HIGH |
| 4.3 | ออกใบเสร็จตามแบบทุกครั้งที่รับเงิน (ยกเว้นกรณีที่ source ระบุ) | Derived + Documentary | HIGH |
| 4.4 | ใบเสร็จมีข้อมูลสาระสำคัญครบถ้วน | Derived + Documentary | HIGH |
| 4.5 | ยอดรวมใบเสร็จตรงกับยอดสรุปของวัน | Derived + Documentary | HIGH |

### Dimension 5 — การควบคุมการจ่ายเงิน

`2515-1: 5.1–5.6`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 5.1 | การจ่ายแต่ละประเภทตรงตามวัตถุประสงค์และระเบียบ/แนวทาง | Derived + Documentary | HIGH |
| 5.2 | ทุกรายการได้รับอนุมัติจาก ผอ. | Derived + Documentary | HIGH |
| 5.3 | จ่ายตรงเจ้าหนี้/ผู้มีสิทธิ และยอดตรงตามอนุมัติ | Derived + Documentary | HIGH |
| 5.4 | มีหลักฐานการจ่ายถูกต้อง ครบถ้วน สมบูรณ์ | Documentary | HIGH |
| 5.5 | ใบเสร็จจากเจ้าหนี้มีรายละเอียดตามที่กำหนด | Documentary | HIGH |
| 5.6 | ประทับ “จ่ายเงินแล้ว” พร้อมลายมือชื่อ ชื่อ และวันที่ | Documentary | HIGH |

### Dimension 6 — การจัดทำบัญชี

`2515-1: 6.1–6.4 + subcriteria`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 6.1 | บันทึกรับจ่ายเงินในสมุดเงินสด/ทะเบียนที่เกี่ยวข้องถูกต้องตรงหลักฐาน | Derived | HIGH |
| 6.2 | ทะเบียนคุมเงินรายได้แผ่นดินครบถ้วน เป็นปัจจุบัน และตรงหลักฐาน | Derived | HIGH |
| 6.3.1 | ทะเบียนคุมหลักฐานขอเบิก | Derived | HIGH |
| 6.3.2 | ทะเบียนคุมเอกสารแทนตัวเงิน | Derived | HIGH |
| 6.3.3(1) | ทะเบียนเงินฝากธนาคารกระแสรายวันครบทุกบัญชี | Derived | HIGH |
| 6.3.3(2) | บันทึกฝาก/จ่ายเช็คครบ ถูกต้อง ตรงหลักฐาน | Derived | HIGH |
| 6.4.1 | สมุดคู่ฝากส่วนราชการผู้เบิก | Derived + Documentary | HIGH |
| 6.4.2 | รายการในสมุดคู่ฝากตรงหลักฐาน | Derived | HIGH |

**Note:** โครงสร้างแบบ 2515-1 ใน Dimension 6 ต้องไม่ถูกยุบให้เหลือเลขข้อแบบ 2515-2 เพราะ 2515-1 แยก controls ย่อยไว้ละเอียดกว่า

### Dimension 7 — การจัดทำรายงานการเงิน

`2515-1: 7.1–7.3 + subcriteria`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 7.1.1 | รายงานประเภทเงินคงเหลือ/รายงานการเงินประจำเดือน | Derived + Submission | HIGH |
| 7.1.2 | งบเทียบยอดเงินฝากธนาคารทุกบัญชีทุกเดือน | Derived + Review | HIGH |
| 7.2.1 | ส่งสำเนา Daily Balance ณ วันทำการสุดท้ายของเดือน | Derived + Submission | HIGH |
| 7.2.2 | ส่งรายงานประเภทเงินคงเหลือ | Derived + Submission | HIGH |
| 7.2.3 | ส่งงบเทียบยอดเงินฝากธนาคาร | Derived + Submission | HIGH |
| 7.3 | รายงานรับ-จ่ายเงินรายได้สถานศึกษาประจำปี ภายใน 30 วันหลังสิ้นปีงบประมาณ | Derived + Submission | HIGH |

### Dimension 8 — การตรวจสอบรับจ่ายประจำวัน

`2515-1: 8.1–8.2 + subcriteria`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 8.1 | แต่งตั้ง/มอบหมายผู้ตรวจสอบรับจ่ายประจำวัน | Documentary | HIGH |
| 8.2.1 | ตรวจยอดรับ/นำส่งกับหลักฐานและสมุดเงินสด และลงชื่อยอดรวมใบเสร็จ | Derived + Documentary | HIGH |
| 8.2.2 | ตรวจยอดจ่ายกับหลักฐานและสมุดเงินสด และลงชื่อยอดคงเหลือ | Derived + Documentary | HIGH |

**Boundary:** Daily Inspection เป็น control ตาม OBEC ไม่ใช่ Audit Assessment capability และไม่ควรสร้าง application role ใหม่จากลายเซ็นบนแบบ

### Dimension 9 — การควบคุมเงินยืม

`2515-1: 9.1–9.6 + subcriteria`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 9.1 + 9.1.1–9.1.5 | สัญญายืมตามแบบ 2 ฉบับ มีสาระสำคัญครบ อนุมัติ ลงชื่อ/วันที่ และวันครบกำหนด | Documentary | HIGH |
| 9.2 | ประมาณการค่าใช้จ่ายแนบสัญญา | Documentary | HIGH |
| 9.3 | ไม่ให้ยืมรายใหม่ก่อนชำระรายเก่า | Derived | HIGH |
| 9.4.1–9.4.2 | ควบคุมลูกหนี้เงินยืม/เอกสารสถานะ | Derived | HIGH |
| 9.5.1–9.5.2 | ส่งใช้เงินยืมภายในเวลาที่กำหนดตามประเภทการยืม | Derived + Documentary | HIGH |
| 9.6.1–9.6.3 | ลูกหนี้ค้างเกินกำหนดมีการเร่งรัด ติดตาม และรายงาน ผอ. | Derived + Documentary | HIGH |

### Dimension 10 — การควบคุมใบเสร็จรับเงิน

`2515-1: 10.1–10.7`

| 2515-1 | Manual-linked control/evidence | Evidence | Confidence |
|---|---|---|---|
| 10.1 | ใช้ใบเสร็จตามแบบ สพฐ. | Documentary/Derived | HIGH |
| 10.2 | ใบเสร็จผิดพลาดแก้ตามวิธีที่กำหนดและลงชื่อกำกับ | Documentary | HIGH |
| 10.3 | ใบเสร็จยกเลิกมีต้นฉบับแนบสำเนาในเล่ม | Documentary | HIGH |
| 10.4 | ทะเบียนคุมใบเสร็จครบถ้วน เป็นปัจจุบัน | Derived | HIGH |
| 10.5 | ไม่ใช้ใบเสร็จข้ามปีงบประมาณ | Derived | HIGH |
| 10.6 | ใบเสร็จเก่าที่ใช้ไม่หมดถูกเลิกใช้/ปรุ/เจาะรู | Documentary | HIGH |
| 10.7 | รายงานการใช้ใบเสร็จสิ้นปีและส่งภายใน 31 ตุลาคม | Derived + Submission | HIGH |

---

## 5. What Codex should implement for GAP-08

### 5.1 Do not build a second accounting system

SAR must sit **above** the controlled financial records.

```text
Canonical Financial Records
        |
        +--> Derived Evidence
        |
External Documents
        |
        +--> Documentary Evidence
        |
        v
SAR Assessment Instance
        |
        +--> 2515-1 item response
        +--> observation
        +--> evidence references
        +--> unresolved findings
        |
        v
2515-2 scoring layer
        |
        v
2515-3 result/report
```

### 5.2 2515-1 response is an assessment assertion

A `YES` means the school has assessed the applicable control and considers it satisfied. It does not merely mean a database record exists.

Example:
- Daily Balance exists ≠ Director reviewed it.
- Receipt exists ≠ every documentary control is satisfied.
- System user role ≠ source appointment/order.

### 5.3 Suggested assessment record

```yaml
assessment_year: <fiscal-year>
school_id: <school>

criterion:
  form: "2515-1"
  code: "8.2.1"

response:
  value: YES | NO | N/A
  note: <optional>

evidence:
  - type: DERIVED | DOCUMENTARY | ATTESTED
    source_ref: <record/document/report>
    as_of: <date>

assessment:
  assessed_by: <authenticated-user>
  assessed_at: <timestamp>

status:
  DRAFT
  IN_PROGRESS
  READY_FOR_SUBMISSION
  SUBMITTED
```

---

## 6. Year-end readiness checks

ก่อน `READY_FOR_SUBMISSION` ระบบควร **surface** unresolved evidence ที่เกี่ยวข้องกับ 2515-1 เช่น:

- Daily Balance ขาดในวันที่มี activity
- Bank reconciliation ยังไม่เสร็จ
- monthly report ยังไม่จัดส่ง
- Advance เกินกำหนด
- receipt-book sequence/control anomaly
- annual School Revenue report ยังไม่ครบ
- annual receipt-use report ยังไม่ครบ
- ขาด appointment/assignment evidence
- ขาด approval/payment/receipt evidence
- ขาด correction/cancellation evidence
- ขาดหลักฐานการเผยแพร่ในกรณีที่ criterion ต้องการ

ระบบควรแสดงเป็น `EVIDENCE GAP` ก่อน ไม่ควรแปลงเป็น `NO` โดยอัตโนมัติ

---

## 7. Explicit non-inferences

ห้ามอนุมานสิ่งต่อไปนี้จาก `manual_2515.md` เพียงอย่างเดียว:

1. สูตรแปลง YES/NO ของ 2515-1 เป็น partial score ของ 2515-2
2. กฎว่า missing evidence = NO
3. N/A rule ที่กว้างกว่าที่ source ระบุ
4. Electronic signature/approval role สำหรับ SAR
5. วันครบกำหนด SAR ที่ต้องเป็นก่อน fiscal-year close
6. Audit role ที่เกิดจาก Daily Inspection
7. Application permission ที่เกิดจาก printed signature
8. SAR เป็นตัวปิดบัญชี/ปิดยอดของปีงบประมาณ

---

## 8. GAP-08 status boundary

P0-05 handoff ระบุว่า GAP-08 ยังเป็น blocker เพราะยังไม่มี complete authoritative annual Self-Assessment instrument/result/submission form หรือ minimum-content rule. Operational forms ของ GAP-01 ถึง GAP-07 ถูก reconcile แล้ว และไม่ควรถูกเปลี่ยนเพราะงาน GAP-08

ดังนั้นเอกสารนี้เป็น **bounded analytical bridge**:
- ใช้กำหนด evidence architecture และ relationship ระหว่าง manual กับ 2515-1
- ใช้เตรียม implementation
- **ไม่อ้างว่าเป็น replacement ของ official GAP-08 instrument**
- ไม่ควรเปลี่ยน `BLK-007` เป็น DONE จากเอกสารนี้เพียงอย่างเดียว

---

## 9. Blueprint recommendation

เพิ่ม reference:

`docs/research/gap-08-sar-2515-1-manual-reference.md`

Suggested Blueprint description:

> Maps the authoritative OBEC B.E. 2515 manual's operational financial controls and annual reporting lifecycle to the detailed Form 2515-1 Self-Assessment criteria. This is an implementation/evidence mapping artifact only. It does not replace the missing authoritative GAP-08 instrument, does not invent scoring rules, and does not create application roles from printed signatures.

## 10. Source basis

Primary:
- `manual_2515.md`
- `SAR_manual_2515.pdf` / Form 2515-1
- `SESAO_Audit_manual_2515.pdf`

Supporting:
- `p0-05-form-report-sample-register.md`
- `2026-08-13_2139_codex_P0-05.md`

## Decision status

`ANALYTICAL / IMPLEMENTATION REFERENCE`

No unsupported mapping should be promoted to an implementation rule without authoritative source evidence.
