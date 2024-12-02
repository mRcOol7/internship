import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import Navbar from './navBar';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';


const TextEditor = () => {
    const [value, setValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const quillRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    const token = localStorage.getItem('token');

    const { state } = location;
    

    const handleChange = (content, delta, source, editor) => {
        setValue(content);
    };

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
        clipboard: {
            matchVisual: false
        },
        keyboard: {
            bindings: {}
        }
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
        if (!token) {
            toast.error("Please login to save content", {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            navigate('/login');
            return;
        }

        setIsSaving(true);

        try {
            const response = await axios.post('http://localhost:5000/api/save-content', 
                { content: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(response.data); 
            toast.success('Content saved successfully!', {
                position: "bottom-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setValue(''); // Clear the editor content
        } catch (error) {
            console.error('Error saving content:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save content';
            toast.error(errorMessage, {
                position: "bottom-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            
            if (error.response?.status === 401) {
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } finally {
            setIsSaving(false);
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
                    onChange={handleChange}
                    modules={modules}
                    formats={formats}
                    placeholder="Start typing your content here..."
                    style={{ height: '300px' , overflow: 'auto'}}
                    className="quill-editor"
                    readOnly={false}
                    preserveWhitespace={true}
                    spellCheck={true}
                />
            </div>
            <button onClick={saveContent} style={buttonStyle} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Content'}
            </button>
        </div>
    );
};



const editorStyle = {
    margin: '80px auto',
    maxWidth: '800px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: 'white',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
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
    opacity: 0.9,
    transition: 'opacity 0.3s',
    ':hover': {
        opacity: 1,
    },
    ':disabled': {
        backgroundColor: '#ccc',
        cursor: 'not-allowed',
    }
};

export default TextEditor;