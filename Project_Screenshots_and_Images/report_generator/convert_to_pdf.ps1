param(
    [string]$docxPath = "c:\Users\kthir\Downloads\fsd project\report_images\Genomics_Laboratory_Sequencing_Workflow_Report_NagaAkshyaK.docx",
    [string]$pdfPath = "c:\Users\kthir\Downloads\fsd project\report_images\Genomics_Laboratory_Sequencing_Workflow_Report_NagaAkshyaK.pdf"
)

Write-Host "Starting Word COM Automation..."
Write-Host "Input docx: $docxPath"
Write-Host "Output pdf: $pdfPath"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = [Microsoft.Office.Interop.Word.WdAlertLevel]::wdAlertsNone

try {
    $doc = $word.Documents.Open($docxPath, $false, $true) # ReadOnly = true
    # 17 = wdFormatPDF
    $wdFormatPDF = 17
    $doc.SaveAs([ref]$pdfPath, [ref]$wdFormatPDF)
    $doc.Close([ref]$false)
    Write-Host "Conversion completed successfully!"
} catch {
    Write-Host "Error during conversion: $_"
} finally {
    $word.Quit([ref]$false)
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
