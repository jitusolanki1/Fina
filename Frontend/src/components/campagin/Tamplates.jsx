import React, { useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $getSelection } from "lexical";

export default function Tamplates() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Resource Launch",
      author: "john mayer",
      subject: "Resource Launch",
      body: "<p>Hello, this is the resource launch template.</p>",
    },
    {
      id: 2,
      name: "Event Invitation",
      author: "john mayer",
      subject: "You are invited",
      body: "<p>Join us for the event...</p>",
    },
  ]);
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const selected = templates.find((t) => t.id === selectedId) || {};
  const [name, setName] = useState(selected.name || "");
  const [subject, setSubject] = useState(selected.subject || "");
  const [body, setBody] = useState(selected.body || "");

  function selectTemplate(id) {
    const t = templates.find((x) => x.id === id);
    setSelectedId(id);
    setName(t.name);
    setSubject(t.subject);
    setBody(t.body);
  }

  function saveTemplate() {
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, name, subject, body } : t))
    );
    alert("Template saved (local)");
  }

  function createNew() {
    const id = Date.now();
    const newT = {
      id,
      name: "New Template",
      author: "you",
      subject: "",
      body: "<p></p>",
    };
    setTemplates((prev) => [newT, ...prev]);
    selectTemplate(id);
  }

  function EditorToolbar() {
    const [editor] = useLexicalComposerContext();
    const [open, setOpen] = React.useState(false);
    const [checked, setChecked] = React.useState({
      first: false,
      last: false,
      sender: false,
      company: false,
    });

    const toggleFormat = (format) => {
      try {
        editor.update(() => {
          const sel = $getSelection();
          if (sel && sel.insertText) {
            const txt = sel.getTextContent();
            // simple markdown-like surround to indicate formatting
            if (format === "bold") sel.insertText(`**${txt || "bold"}**`);
            if (format === "italic") sel.insertText(`*${txt || "italic"}*`);
            if (format === "underline")
              sel.insertText(`${txt || "underlined"}`);
          }
        });
        editor.focus();
      } catch (e) {
        console.error(e);
      }
    };

    const insertToken = (token) => {
      try {
        editor.update(() => {
          const sel = $getSelection();
          if (sel && sel.insertText) {
            sel.insertText(token);
          }
        });
        editor.focus();
      } catch (e) {
        console.error(e);
      }
    };

    const handleAddPersonalization = () => {
      // insert selected tokens at cursor
      if (checked.first) insertToken("{{first_name}}");
      if (checked.last) insertToken("{{last_name}}");
      if (checked.sender) insertToken("{{sender_name}}");
      if (checked.company) insertToken("{{company_name}}");
      setOpen(false);
    };

    return (
      <div className="editor-toolbar">
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="control-btn primary-btn"
            onClick={() => setOpen((s) => !s)}
          >
            Add Personalization
          </button>
          <button
            className="control-btn small"
            onClick={() => toggleFormat("bold")}
          >
            <strong>B</strong>
          </button>
          <button
            className="control-btn small"
            onClick={() => toggleFormat("italic")}
          >
            <em>I</em>
          </button>
          <button
            className="control-btn small"
            onClick={() => toggleFormat("underline")}
          >
            <span style={{ textDecoration: "underline" }}>U</span>
          </button>
          <button
            className="control-btn small"
            onClick={() => insertToken("• ")}
          >
            •
          </button>
          <button
            className="control-btn small"
            onClick={() => insertToken("`code`")}
          >
            {"<>"}
          </button>
          <button
            className="control-btn small"
            onClick={() => insertToken("😊")}
          >
            😊
          </button>
        </div>

        {open && (
          <div className="personalization-dropdown">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Personalization
            </div>
            <label>
              <input
                type="checkbox"
                checked={checked.first}
                onChange={(e) =>
                  setChecked((c) => ({ ...c, first: e.target.checked }))
                }
              />{" "}
              First Name
            </label>
            <label>
              <input
                type="checkbox"
                checked={checked.last}
                onChange={(e) =>
                  setChecked((c) => ({ ...c, last: e.target.checked }))
                }
              />{" "}
              Last Name
            </label>
            <label>
              <input
                type="checkbox"
                checked={checked.sender}
                onChange={(e) =>
                  setChecked((c) => ({ ...c, sender: e.target.checked }))
                }
              />{" "}
              Sender Name
            </label>
            <label>
              <input
                type="checkbox"
                checked={checked.company}
                onChange={(e) =>
                  setChecked((c) => ({ ...c, company: e.target.checked }))
                }
              />{" "}
              Company Name
            </label>
            <div className="actions">
              <button className="control-btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleAddPersonalization}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#9aa4b6" }}>Campaign</div>
          <div style={{ color: "#9aa4b6" }}>›</div>
          <div style={{ fontWeight: 700 }}>Create Template</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="control-btn" onClick={() => {}}>
            Preview
          </button>
          <button className="control-btn" onClick={createNew}>
            + Create new template
          </button>
        </div>
      </div>

      <div className="templates-layout">
        <aside className="template-list">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 700 }}>E-mail Templates</div>
            <select className="control-btn" style={{ background: "#0F0F0F" }}>
              <option>Filter by</option>
            </select>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => selectTemplate(t.id)}
                className={`template-item ${
                  t.id === selectedId ? "template-selected" : ""
                }`}
              >
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Created by {t.author}
                </div>
              </div>
            ))}
          </div>

          <div className="template-list-footer">
            <button
              className="primary-btn"
              style={{ width: "100%" }}
              onClick={createNew}
            >
              + Create new template
            </button>
          </div>
        </aside>

        <section className="templates-right">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 700 }}>Enter Details</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="control-btn"
                onClick={() => window.alert("Preview")}
              >
                Preview
              </button>
              <button
                className="control-btn"
                onClick={() =>
                  window.confirm("Delete?") &&
                  setTemplates((prev) =>
                    prev.filter((x) => x.id !== selectedId)
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <div>
              <label className="text-sm text-slate-300">Template Name</label>
              <input
                className="auth-input mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Tag</label>
              <input
                className="auth-input mt-1"
                placeholder="Enter or create template tags..."
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Subject</label>
              <input
                className="auth-input mt-1"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div style={{ position: "relative" }}>
              <label className="text-sm text-slate-300">Content</label>
              <div style={{ marginTop: 8 }}>
                <LexicalComposer
                  initialConfig={{
                    namespace: "TemplatesEditor",
                    theme: {},
                    onError: (err) => {
                      console.error(err);
                    },
                  }}
                >
                  <div
                    className="editor-shell"
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 8,
                      background: "#080808",
                      minHeight: 220,
                      position: "relative",
                    }}
                  >
                    <RichTextPlugin
                      contentEditable={
                        <ContentEditable className="editor-input" />
                      }
                      placeholder={
                        <div style={{ color: "#9aa4b6" }}>
                          Enter template content...
                        </div>
                      }
                    />
                    <HistoryPlugin />
                    <OnChangePlugin
                      onChange={(editorState, editor) => {
                        try {
                          editorState.read(() => {
                            const root = $getRoot();
                            const text = root.getTextContent();
                            setBody(text);
                          });
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    />

                    <EditorToolbar />
                  </div>
                </LexicalComposer>
              </div>

            </div>

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button className="control-btn" onClick={saveTemplate}>
                Save
              </button>
              <button className="control-btn" onClick={createNew}>
                Duplicate + New
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
