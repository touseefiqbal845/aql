"""Build the manuscript PDF: python scripts/build_manuscript.py (requires reportlab)."""
from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/AQL_Research_Manuscript.md'
OUTPUT = SOURCE.with_suffix('.pdf')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='PaperTitle', fontName='Helvetica-Bold', fontSize=17, leading=21, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name='PaperBody', fontName='Helvetica', fontSize=10, leading=14, spaceAfter=8))
styles.add(ParagraphStyle(name='Author', fontName='Helvetica-Bold', fontSize=11, leading=15, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name='PaperCode', fontName='Courier', fontSize=8, leading=11, leftIndent=8, spaceBefore=5, spaceAfter=10))
for name in ['Heading2','Heading3']:
 styles[name].textColor=colors.HexColor('#173b56')
 styles[name].spaceBefore=12
 styles[name].spaceAfter=7
 styles[name].keepWithNext=True

def footer(canvas, doc):
 canvas.saveState()
 canvas.setStrokeColor(colors.HexColor('#d6dfe6'))
 canvas.line(54,43,541,43)
 canvas.setFont('Helvetica',8)
 canvas.setFillColor(colors.HexColor('#546778'))
 canvas.drawString(54,30,'AQL | Touseef Iqbal | Research proposal and prototype')
 canvas.drawRightString(541,30,str(doc.page))
 canvas.restoreState()

def build():
 story=[]
 blocks=SOURCE.read_text(encoding='utf-8').split('\n\n')
 in_code=False
 code=[]
 for block in blocks:
  block=block.strip()
  if not block:continue
  if block.startswith('```'):
   raw=block.split('\n')[1:]
   if raw and raw[-1]=='```':raw=raw[:-1]
   story.append(Preformatted('\n'.join(raw),styles['PaperCode']))
  elif block.startswith('# '):story.append(Paragraph(escape(block[2:]),styles['PaperTitle']))
  elif block.startswith('### '):story.append(Paragraph(escape(block[4:]),styles['Heading3']))
  elif block.startswith('## '):story.append(Paragraph(escape(block[3:]),styles['Heading2']))
  elif block=='**Touseef Iqbal**':story.append(Paragraph('Touseef Iqbal',styles['Author']))
  elif block.startswith('- '):
   for item in block.split('\n- '):story.append(Paragraph(escape(item.removeprefix('- ')),styles['PaperBody'],bulletText='-'))
  else:story.append(Paragraph(escape(block).replace('\n',' '),styles['PaperBody']))
 SimpleDocTemplate(str(OUTPUT),pagesize=(595.28,841.89),rightMargin=54,leftMargin=54,topMargin=48,bottomMargin=58,title='AQL: A Declarative Query Language for Unified Discovery and Execution of Heterogeneous AI Capabilities',author='Touseef Iqbal',subject='High-level approach, prototype status, reliability roadmap, and evaluation protocol').build(story,onFirstPage=footer,onLaterPages=footer)
 print(OUTPUT)

if __name__=='__main__':build()
