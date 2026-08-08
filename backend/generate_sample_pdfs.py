import os

def make_pdf(filepath, title, body_text):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    # Minimal valid PDF 1.4 stream structure
    content = f"BT /F1 18 Tf 50 720 Td ({title}) Tj ET BT /F1 11 Tf 50 680 Td ({body_text[:80]}) Tj ET BT /F1 11 Tf 50 660 Td ({body_text[80:160]}) Tj ET BT /F1 11 Tf 50 640 Td ({body_text[160:240]}) Tj ET BT /F1 11 Tf 50 620 Td ({body_text[240:320]}) Tj ET"
    stream_len = len(content)
    pdf_data = (
        f"%PDF-1.4\n"
        f"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        f"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        f"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
        f"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        f"5 0 obj << /Length {stream_len} >> stream\n{content}\nendstream\nendobj\n"
        f"xref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000244 00000 n \n0000000310 00000 n \n"
        f"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n{400 + stream_len}\n%%EOF"
    )
    with open(filepath, "wb") as f:
        f.write(pdf_data.encode("latin-1", "ignore"))

def main():
    pub = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "sample_docs")
    tmp = "/tmp/sample_docs"

    doc1_text = "CogniCite AI is an enterprise RAG platform built for document intelligence. It integrates FastAPI, MongoDB Atlas Vector Search, and Gemini Flash LLM. The system delivers sub-second retrieval across PDF repositories with 768-dimensional embeddings, rate-limit pacing, and automatic FastEmbed ONNX local fallback."
    doc2_text = "Global Tech Corp Annual Financial Report 2025: Consolidated Revenue reached 4.85 Billion USD (+24.5 percent YoY). Cloud and AI Enterprise Software accounted for 62 percent of net recurring revenue. EBITDA expanded by 28 percent to 1.12 Billion USD with 650 Million USD allocated for FY2026 AI R&D."
    doc3_text = "Enterprise AI Governance, Data Privacy & Security Policy: All documents processed by CogniCite AI are encrypted at rest with AES-256 and in transit via TLS 1.3. User document payloads are strictly isolated in dedicated Atlas collections and never used for public model training. SOC 2 Type II compliant."

    make_pdf(os.path.join(pub, "CogniCite_Architecture.pdf"), "CogniCite AI Architecture Spec", doc1_text)
    make_pdf(os.path.join(tmp, "CogniCite_Architecture.pdf"), "CogniCite AI Architecture Spec", doc1_text)

    make_pdf(os.path.join(pub, "Global_Tech_Financial_2025.pdf"), "Global Tech Financial Report 2025", doc2_text)
    make_pdf(os.path.join(tmp, "Global_Tech_Financial_2025.pdf"), "Global Tech Financial Report 2025", doc2_text)

    make_pdf(os.path.join(pub, "AI_Security_Compliance.pdf"), "AI Security and Compliance Policy", doc3_text)
    make_pdf(os.path.join(tmp, "AI_Security_Compliance.pdf"), "AI Security and Compliance Policy", doc3_text)

    print("✅ Created 3 sample PDFs in public/sample_docs and /tmp/sample_docs!")

if __name__ == "__main__":
    main()
