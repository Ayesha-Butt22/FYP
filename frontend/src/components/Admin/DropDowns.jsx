import React, {useEffect, useRef, useState} from "react";

export function DropdownSingleSelect({ value = "", options = [], onChange = () => {}, placeholder = placeholder }) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtered = options.filter(opt =>
        opt.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="speciality-dropdown-multiselect" ref={containerRef}>
            <div
                className="dropdown-selected-area"
                onClick={() => setOpen(o => !o)}
                tabIndex={0}
                style={{
                    minHeight: 36,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    background: "#f7f8ff",
                    borderRadius: 8,
                    border: "1px solid #dbdbec",
                    padding: "4px 7px",
                    justifyContent: "space-between"
                }}
            >
        <span style={{ color: value ? "#000" : "#aaa" }}>
          {value || placeholder}
        </span>
                <span style={{ color: "#01337a", fontWeight: 900, fontSize: 18 }}>▼</span>
            </div>
            {open && (
                <div className="dropdown-list">
                    {filtered.length === 0 ? (
                        <span className="dropdown-list-item" style={{ color: "#aaa" }}>No options</span>
                    ) : (
                        filtered.map((opt) => (
                            <span
                                key={opt}
                                className="dropdown-list-item"
                                onMouseDown={() => {
                                    onChange(opt);
                                    setOpen(false);
                                    setInput("");
                                }}
                            >
                {opt}
              </span>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}


export function DropdownMultiSelect({ value = [], options = [], onChange = () => {}, placeholder = placeholder }) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const containerRef = useRef(null);

    React.useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtered = options.filter(
        (opt) => !value.includes(opt) && opt.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="speciality-dropdown-multiselect" ref={containerRef}>
            <div
                className="dropdown-selected-area"
                onClick={() => setOpen((o) => !o)}
                tabIndex={0}
                style={{
                    minHeight: 36,
                    cursor: "pointer",
                    display: 'flex',
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    background: "#f7f8ff",
                    borderRadius: 8,
                    border: "1px solid #dbdbec",
                    padding: "4px 7px"
                }}
            >
                {value.map((spec, idx) => (
                    <span className="speciality-chip" key={idx}>
            {spec}
                        <button
                            type="button"
                            className="chip-remove"
                            tabIndex={-1}
                            onClick={e => {
                                e.stopPropagation();
                                onChange(value.filter((s) => s !== spec));
                            }}
                        >
              ×
            </button>
          </span>
                ))}
                <input
                    type="text"
                    placeholder={value.length === 0 ? placeholder : ""}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onClick={e => { e.stopPropagation(); setOpen(true); }}
                    style={{
                        flex: 1,
                        minWidth: 70,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "1rem"
                    }}
                />
                <span style={{marginLeft: 2, color: "#01337a", fontWeight: 900, fontSize: 18, userSelect: "none"}}>▼</span>
            </div>
            {open && (
                <div className="dropdown-list">
                    {filtered.length === 0 ? (
                        <span className="dropdown-list-item" style={{color:"#aaa"}}>No options</span>
                    ) : (
                        filtered.map((spec) => (
                            <span
                                key={spec}
                                className="dropdown-list-item"
                                onMouseDown={() => {
                                    onChange([...value, spec]);
                                    setInput("");
                                    setOpen(false);
                                }}
                            >
                {spec}
              </span>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}