import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

/**
 * Export a DOM element as PNG image
 */
export const exportToPNG = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'analysis_report.png',
    quality = 1,
    scale = 2,
    backgroundColor = '#ffffff'
  } = options;

  try {
    // Show loading state
    const loadingToast = showLoadingToast('Generating PNG...');

    // Configure html2canvas options for high quality
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure all styles are properly applied to the cloned document
        const clonedElement = clonedDoc.querySelector('[data-export-target]') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'static';
        }
      }
    });

    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', quality);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    hideLoadingToast(loadingToast);
    showSuccessToast('PNG exported successfully!');
  } catch (error) {
    console.error('PNG export failed:', error);
    showErrorToast('Failed to export PNG. Please try again.');
    throw error;
  }
};

/**
 * Export a DOM element as PDF document
 */
export const exportToPDF = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'analysis_report.pdf',
    quality = 1,
    scale = 2,
    backgroundColor = '#ffffff'
  } = options;

  try {
    // Show loading state
    const loadingToast = showLoadingToast('Generating PDF...');

    // Configure html2canvas options for PDF
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure all styles are properly applied to the cloned document
        const clonedElement = clonedDoc.querySelector('[data-export-target]') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'static';
        }
      }
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add title page
    pdf.setFontSize(20);
    pdf.text('Campus Resources Analysis Report', 20, 30);
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    pdf.text(`Generated at: ${new Date().toLocaleTimeString()}`, 20, 55);

    // Add the main content
    const imgData = canvas.toDataURL('image/png', quality);
    
    // If content fits on one page
    if (imgHeight <= pageHeight - 70) {
      pdf.addImage(imgData, 'PNG', 0, 70, imgWidth, imgHeight);
    } else {
      // Multi-page PDF
      pdf.addImage(imgData, 'PNG', 0, 70, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 70);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    // Add footer to all pages
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.text(
        `Page ${i} of ${pageCount} - Campus Resources Management System`,
        20,
        pageHeight - 10
      );
    }

    // Save the PDF
    pdf.save(filename);

    hideLoadingToast(loadingToast);
    showSuccessToast('PDF exported successfully!');
  } catch (error) {
    console.error('PDF export failed:', error);
    showErrorToast('Failed to export PDF. Please try again.');
    throw error;
  }
};

/**
 * Export both PDF and PNG simultaneously
 */
export const exportBoth = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const baseFilename = options.filename?.replace(/\.[^/.]+$/, '') || 'analysis_report';
  
  try {
    await Promise.all([
      exportToPDF(element, { ...options, filename: `${baseFilename}.pdf` }),
      exportToPNG(element, { ...options, filename: `${baseFilename}.png` })
    ]);
  } catch (error) {
    console.error('Batch export failed:', error);
    throw error;
  }
};

/**
 * Prepare element for export by adding necessary attributes and styles
 */
export const prepareElementForExport = (element: HTMLElement): void => {
  element.setAttribute('data-export-target', 'true');
  
  // Ensure all images are loaded
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.complete) {
      img.loading = 'eager';
    }
  });

  // Ensure all charts are rendered
  const charts = element.querySelectorAll('.recharts-wrapper');
  charts.forEach(chart => {
    const chartElement = chart as HTMLElement;
    chartElement.style.backgroundColor = 'white';
  });
};

/**
 * Clean up after export
 */
export const cleanupAfterExport = (element: HTMLElement): void => {
  element.removeAttribute('data-export-target');
};

// Toast notification helpers
let toastContainer: HTMLElement | null = null;

const createToastContainer = (): HTMLElement => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'export-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const showLoadingToast = (message: string): HTMLElement => {
  const container = createToastContainer();
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #3b82f6;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    pointer-events: auto;
  `;
  
  toast.innerHTML = `
    <div style="
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
    ${message}
  `;

  // Add CSS animation
  if (!document.getElementById('export-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'export-toast-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);
  return toast;
};

const hideLoadingToast = (toast: HTMLElement): void => {
  if (toast && toast.parentNode) {
    toast.parentNode.removeChild(toast);
  }
};

const showSuccessToast = (message: string): void => {
  const container = createToastContainer();
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    pointer-events: auto;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
};

const showErrorToast = (message: string): void => {
  const container = createToastContainer();
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #ef4444;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    pointer-events: auto;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 5000);
};