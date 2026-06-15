'use client';

import { CADAnalysisResult } from './types';
import {jsPDF} from 'jspdf';

/**
 * Generates a formatted PDF from CAD analysis results
 */
export function exportAnalysisAsPDF(
  result: CADAnalysisResult,
  filename: string = 'cad-analysis.pdf'
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 7; // Increased line height for better readability
  const maxY = pageHeight - margin; // Maximum Y position before new page
  let yPos = 20;

  // Helper function to check if we need a new page
  const checkNewPage = (spaceNeeded: number = 15) => {
    if (yPos + spaceNeeded > maxY) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CAD Analysis Report', margin, yPos);
  yPos += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
  yPos += 15;

  // Summary Section
  checkNewPage(20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(result.summary, contentWidth);
  summaryLines.forEach((line: string) => {
    checkNewPage();
    doc.text(line, margin, yPos);
    yPos += lineHeight;
  });
  yPos += 8;

  // Key Metrics Section
  checkNewPage(20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Wrap each metric in case values are long
  const complexityLines = doc.splitTextToSize(`Manufacturing Complexity: ${result.manufacturingComplexity}`, contentWidth);
  complexityLines.forEach((line: string) => {
    checkNewPage();
    doc.text(line, margin, yPos);
    yPos += lineHeight;
  });
  
  const leadTimeLines = doc.splitTextToSize(`Estimated Lead Time: ${result.estimatedLeadTime}`, contentWidth);
  leadTimeLines.forEach((line: string) => {
    checkNewPage();
    doc.text(line, margin, yPos);
    yPos += lineHeight;
  });
  yPos += 8;

  // Materials Section
  if (result.materials && result.materials.length > 0) {
    checkNewPage(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Materials Required', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    result.materials.forEach((material) => {
      const materialLines = doc.splitTextToSize(`• ${material}`, contentWidth - 5);
      materialLines.forEach((line: string) => {
        checkNewPage();
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
    });
    yPos += 8;
  }

  // Key Specifications Section
  if (result.keySpecifications && Object.keys(result.keySpecifications).length > 0) {
    checkNewPage(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Specifications', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    Object.entries(result.keySpecifications).forEach(([key, value]) => {
      const specLines = doc.splitTextToSize(`${key}: ${value}`, contentWidth - 5);
      specLines.forEach((line: string) => {
        checkNewPage();
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
    });
    yPos += 8;
  }

  // Recommendations Section
  if (result.recommendations && result.recommendations.length > 0) {
    checkNewPage(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    result.recommendations.forEach((rec) => {
      const recLines = doc.splitTextToSize(`• ${rec}`, contentWidth - 5);
      recLines.forEach((line: string) => {
        checkNewPage();
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += 3; // Add small spacing between recommendations
    });
  }

  // Save the PDF
  doc.save(filename);
}

/**
 * Generates a CSV file from CAD analysis results
 */
export function exportAnalysisAsCSV(
  result: CADAnalysisResult,
  filename: string = 'cad-analysis.csv'
): void {
  const rows: string[][] = [];

  // Header
  rows.push(['CAD Analysis Report']);
  rows.push(['Generated', new Date().toLocaleString()]);
  rows.push([]);

  // Summary
  rows.push(['Summary']);
  rows.push([result.summary]);
  rows.push([]);

  // Key Metrics
  rows.push(['Key Metrics']);
  rows.push(['Metric', 'Value']);
  rows.push(['Manufacturing Complexity', result.manufacturingComplexity]);
  rows.push(['Estimated Lead Time', result.estimatedLeadTime]);
  rows.push([]);

  // Materials
  if (result.materials && result.materials.length > 0) {
    rows.push(['Materials Required']);
    result.materials.forEach((material) => {
      rows.push([material]);
    });
    rows.push([]);
  }

  // Key Specifications
  if (result.keySpecifications && Object.keys(result.keySpecifications).length > 0) {
    rows.push(['Key Specifications']);
    rows.push(['Specification', 'Value']);
    Object.entries(result.keySpecifications).forEach(([key, value]) => {
      rows.push([key, String(value)]);
    });
    rows.push([]);
  }

  // Recommendations
  if (result.recommendations && result.recommendations.length > 0) {
    rows.push(['Recommendations']);
    result.recommendations.forEach((rec) => {
      rows.push([rec]);
    });
  }

  // Convert to CSV string
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    )
    .join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
