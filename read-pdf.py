import fitz

pdf = fitz.open("reseach/คำสั่งการปฏิบัติหน้าที่ หน่วยตรวจสอบภายใน.pdf")

for page_no, page in enumerate(pdf):
    print(f"--- PAGE {page_no + 1} ---")
    print(page.get_text())