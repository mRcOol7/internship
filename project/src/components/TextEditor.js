import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import Navbar from './navBar';

const TextEditor = ({ token }) => {
    const [value, setValue] = useState('');
    const quillRef = useRef(null);

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['code-block', 'blockquote'],
            [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }, { direction: 'rtl' }],
            [{ indent: '-1' }, { indent: '+1' }],
            ['formula'],
            ['clean'],
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'link', 'image',
        'code-block',
        'blockquote',
        'font', 'size',
        'color', 'background',
        'align', 'direction',
        'indent',
        'formula',
        'clean',
    ];

    const saveContent = async () => {
        const token = localStorage.getItem('token'); 
        try {
            const response = await axios.post('http://localhost:5000/api/save-content', 
                { content: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(response.data); 
            alert('Content saved successfully!');
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Failed to save content.');
        }
    };
    

    return (
        <div>
            <Navbar />
            <h2 className='editor'>Text Editor</h2>
            <div style={editorStyle}>
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={value}
                    onChange={setValue}
                    modules={modules}
                    formats={formats}
                    placeholder="Start typing your content here..."
                />
            </div>
            <button onClick={saveContent} style={buttonStyle}>Save Content</button>
        </div>
    );
};

const editorStyle = {
    margin: '20px auto',
    maxWidth: '800px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
};

const buttonStyle = {
    display: 'block',
    margin: '20px auto',
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
};

export default TextEditor;