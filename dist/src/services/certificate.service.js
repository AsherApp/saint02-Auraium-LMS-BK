import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { supabaseAdmin } from '../lib/supabase.js';
export class CertificateService {
    static defaultTemplate = {
        id: 'default',
        name: 'Default Certificate Template',
        templatePath: '',
        fields: {
            studentName: { x: 300, y: 400, fontSize: 24, color: '#000000' },
            courseTitle: { x: 300, y: 350, fontSize: 18, color: '#333333' },
            completionDate: { x: 300, y: 300, fontSize: 14, color: '#666666' }
        }
    };
    /**
     * Generate a certificate for a student who completed a course
     */
    static async generateCertificate(data) {
        try {
            // Create a new PDF document (A4 size: 595 x 842 points)
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([595, 842]); // A4 size
            // Get the default font
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            // Set background color (light gray)
            page.drawRectangle({
                x: 0,
                y: 0,
                width: 595,
                height: 842,
                color: rgb(0.95, 0.95, 0.95),
            });
            // Draw border
            page.drawRectangle({
                x: 50,
                y: 50,
                width: 495,
                height: 742,
                borderColor: rgb(0, 0, 0),
                borderWidth: 2,
            });
            // Add title
            page.drawText('CERTIFICATE OF COMPLETION', {
                x: 150,
                y: 700,
                size: 28,
                font: font,
                color: rgb(0, 0, 0),
            });
            // Add subtitle
            page.drawText('This is to certify that', {
                x: 200,
                y: 650,
                size: 16,
                font: font,
                color: rgb(0.2, 0.2, 0.2),
            });
            // Add student name
            page.drawText(data.studentName, {
                x: this.defaultTemplate.fields.studentName.x,
                y: this.defaultTemplate.fields.studentName.y,
                size: this.defaultTemplate.fields.studentName.fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });
            // Add course title
            page.drawText(`has successfully completed the course:`, {
                x: 150,
                y: 320,
                size: 14,
                font: font,
                color: rgb(0.2, 0.2, 0.2),
            });
            page.drawText(data.courseTitle, {
                x: this.defaultTemplate.fields.courseTitle.x,
                y: this.defaultTemplate.fields.courseTitle.y,
                size: this.defaultTemplate.fields.courseTitle.fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });
            // Add completion date
            page.drawText(`Completed on: ${data.completionDate}`, {
                x: this.defaultTemplate.fields.completionDate.x,
                y: this.defaultTemplate.fields.completionDate.y,
                size: this.defaultTemplate.fields.completionDate.fontSize,
                font: font,
                color: rgb(0.3, 0.3, 0.3),
            });
            // Add signature line
            page.drawText('_________________________', {
                x: 400,
                y: 150,
                size: 14,
                font: font,
                color: rgb(0, 0, 0),
            });
            page.drawText('Instructor Signature', {
                x: 420,
                y: 130,
                size: 12,
                font: font,
                color: rgb(0.3, 0.3, 0.3),
            });
            // Generate PDF bytes
            const pdfBytes = await pdfDoc.save();
            // Save to Supabase storage
            const fileName = `certificates/${data.studentEmail.replace('@', '_at_')}_${data.courseId}_${Date.now()}.pdf`;
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('Files')
                .upload(fileName, pdfBytes, {
                contentType: 'application/pdf',
                upsert: false
            });
            if (uploadError) {
                throw new Error(`Failed to upload certificate: ${uploadError.message}`);
            }
            // Get public URL
            const { data: urlData } = supabaseAdmin.storage
                .from('Files')
                .getPublicUrl(fileName);
            // Save certificate record to database
            const { error: dbError } = await supabaseAdmin
                .from('certificates')
                .insert({
                student_email: data.studentEmail,
                course_id: data.courseId,
                certificate_path: fileName,
                student_name: data.studentName,
                course_title: data.courseTitle,
                completion_date: data.completionDate
            });
            if (dbError) {
                console.error('Failed to save certificate record:', dbError);
                // Don't throw error here as the PDF was generated successfully
            }
            return urlData.publicUrl;
        }
        catch (error) {
            console.error('Certificate generation failed:', error);
            throw new Error(`Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get certificate for a student and course
     */
    static async getCertificate(studentEmail, courseId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('certificates')
                .select('certificate_path')
                .eq('student_email', studentEmail)
                .eq('course_id', courseId)
                .single();
            if (error || !data) {
                return null;
            }
            // Get public URL
            const { data: urlData } = supabaseAdmin.storage
                .from('Files')
                .getPublicUrl(data.certificate_path);
            return urlData.publicUrl;
        }
        catch (error) {
            console.error('Failed to get certificate:', error);
            return null;
        }
    }
    /**
     * Check if student has completed a course
     */
    static async isCourseCompleted(studentEmail, courseId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('enrollments')
                .select('completed_at')
                .eq('student_email', studentEmail)
                .eq('course_id', courseId)
                .single();
            if (error || !data) {
                return false;
            }
            return data.completed_at !== null;
        }
        catch (error) {
            console.error('Failed to check course completion:', error);
            return false;
        }
    }
    /**
     * Mark course as completed for a student
     */
    static async markCourseCompleted(studentEmail, courseId) {
        try {
            const { error } = await supabaseAdmin
                .from('enrollments')
                .update({
                completed_at: new Date().toISOString(),
                completion_percentage: 100
            })
                .eq('student_email', studentEmail)
                .eq('course_id', courseId);
            if (error) {
                throw new Error(`Failed to mark course as completed: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Failed to mark course as completed:', error);
            throw error;
        }
    }
}
