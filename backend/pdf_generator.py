from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime

def generate_invoice_pdf(invoice, business, customer=None):
    """
    Generate a PDF invoice
    
    Args:
        invoice: Invoice model instance
        business: Business model instance
        customer: Customer model instance (optional)
    
    Returns:
        BytesIO object containing PDF data
    """
    
    # Create PDF buffer
    pdf_buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
    )
    
    # Container for PDF elements
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=6,
        alignment=1  # Center alignment
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#1f2937'),
    )
    
    # Title
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Business and Invoice Info
    created_date = invoice.created_at.strftime('%B %d, %Y') if invoice.created_at else 'N/A'
    business_info = f"""
    <b>{business.business_name if business else 'Business'}</b><br/>
    Invoice #: {invoice.invoice_number}<br/>
    Date: {created_date}<br/>
    """
    elements.append(Paragraph(business_info, normal_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Customer Info
    if customer:
        address = customer.address if customer.address else 'N/A'
        city = customer.city if customer.city else ''
        state = customer.state if customer.state else ''
        pincode = customer.pincode if customer.pincode else ''
        
        full_address = f"{address}"
        if city:
            full_address += f", {city}"
        if state:
            full_address += f", {state}"
        if pincode:
            full_address += f" {pincode}"
        
        customer_info = f"""
        <b>Bill To:</b><br/>
        Name: {customer.customer_name}<br/>
        Email: {customer.email if customer.email else 'N/A'}<br/>
        Phone: {customer.phone if customer.phone else 'N/A'}<br/>
        Address: {full_address}<br/>
        """
        elements.append(Paragraph(customer_info, normal_style))
    else:
        elements.append(Paragraph("<b>Bill To:</b><br/>Walk-in Customer", normal_style))
    
    elements.append(Spacer(1, 0.2*inch))
    
    # Items Table
    items_data = [['Item', 'Qty', 'Unit Price', 'Tax %', 'Tax Amount', 'Total']]
    
    for item in invoice.items:
        product_name = item.product.product_name if item.product else 'Product'
        items_data.append([
            product_name,
            f"{item.quantity}",
            f"₹{item.unit_price:.2f}",
            f"{item.tax_percentage}%",
            f"₹{item.tax_amount:.2f}",
            f"₹{item.total_amount:.2f}",
        ])
    
    # Create table
    items_table = Table(items_data, colWidths=[2.2*inch, 0.6*inch, 1*inch, 0.7*inch, 0.9*inch, 1*inch])
    
    # Style table
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Totals
    totals_data = [
        ['Subtotal:', f"₹{invoice.subtotal:.2f}"],
        ['Tax:', f"₹{invoice.tax_amount:.2f}"],
        ['Discount:', f"₹{invoice.discount_amount:.2f}"],
        ['Total:', f"₹{invoice.grand_total:.2f}"],
    ]
    
    totals_table = Table(totals_data, colWidths=[5*inch, 1.5*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(totals_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Payment Method and Status
    payment_method = invoice.payment_method.value.upper() if invoice.payment_method else 'N/A'
    payment_status = invoice.payment_status.value.upper() if invoice.payment_status else 'N/A'
    
    # Highlight unpaid status in red
    if payment_status == 'UNPAID':
        payment_info = f"""
        <b>Payment Method:</b> {payment_method}<br/>
        <b><font color="red">Status: {payment_status}</font></b>
        """
    else:
        payment_info = f"""
        <b>Payment Method:</b> {payment_method}<br/>
        <b>Status:</b> {payment_status}
        """
    elements.append(Paragraph(payment_info, normal_style))
    
    # Notes if any
    if invoice.notes:
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph(f"<b>Notes:</b> {invoice.notes}", normal_style))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer = """
    <center>
    Thank you for your business!<br/>
    <i>This is a computer generated invoice</i>
    </center>
    """
    elements.append(Paragraph(footer, normal_style))
    
    # Build PDF
    doc.build(elements)
    
    # Reset buffer position to beginning
    pdf_buffer.seek(0)
    
    return pdf_buffer

