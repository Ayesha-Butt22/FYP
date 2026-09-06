import React, { useState } from "react";
import "./UploadExcelModal.css";
import ToastService from "./ToastService/ToastService.jsx";

const UploadExcelModal = ({ isOpen, onClose }) => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus("");
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) {
            ToastService.error('please upload a file');
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setStatus("Uploading...");
            const token = localStorage.getItem("token");
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/upload-excel`, {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                ToastService.success('Upload Successful. You will be redirected after 5 seconds')
                setStatus("✅ Upload successful!");
                setResult({
                    created: data.createdCount,
                    skipped: data.skippedCount,
                    message: data.message,
                });
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            } else {
                ToastService.error('Upload failed');
                setStatus(`❌ Error: ${data.error || "Upload failed"}`);
            }
        } catch (error) {
            ToastService.error('upload failed');
            setStatus("❌ Server error during upload");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <h2 className="modal-title">Upload Excel File</h2>

                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="file-input"
                />

                {file && <p className="file-name">Selected: {file.name}</p>}

                {status && <p className="status-message">{status}</p>}

                {result && (
                    <div className="upload-result">
                        <p><strong>{result.message}</strong></p>
                        <p>✅ Created Users: {result.created}</p>
                        <p>⚠️ Skipped Users: {result.skipped}</p>
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={handleUpload} className="upload-btn">
                        Upload
                    </button>
                    <button onClick={onClose} className="cancel-btn">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadExcelModal;
