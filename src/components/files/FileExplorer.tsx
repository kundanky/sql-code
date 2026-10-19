import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Share2,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  FilePlus,
  RefreshCw,
  FolderInput,
} from 'lucide-react';
import { FileItem, StorageInfo, ThemeConfig } from '../../types/index.ts';
import {
  listFiles,
  createFile,
  createFolder,
  renameItem,
  duplicateFile,
  deleteItem,
  exportFile,
  importFileFromDevice,
  searchFiles,
  getStorageInfo,
  requestDirectoryAccess,
  subscribeStorageEvents,
} from '../../utils/fileStorage.ts';

interface Props {
  onOpenFile: (file: FileItem) => void;
  activeFilePath?: string;
  theme: ThemeConfig;
  onFileRenamed?: (oldPath: string, newPath: string, newName: string) => void;
}

export const FileExplorer: React.FC<Props> = ({ onOpenFile, activeFilePath, theme, onFileRenamed }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '/projects': true,
    '/projects/Default': true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchContent, setSearchContent] = useState(false);
  const [searchResults, setSearchResults] = useState<FileItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>(getStorageInfo());

  // Context Menu state
  const [contextItem, setContextItem] = useState<{ item: FileItem; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<any>(null);

  // Modals state
  const [modalType, setModalType] = useState<'newFile' | 'newFolder' | 'rename' | 'delete' | null>(null);
  const [targetItem, setTargetItem] = useState<FileItem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files
  const loadTree = async () => {
    try {
      const items = await listFiles('/projects');
      setFiles(items);
      setStorageInfo(getStorageInfo());
    } catch (err) {
      console.warn('Failed to list files:', err);
    }
  };

  useEffect(() => {
    loadTree();
    const unsubscribe = subscribeStorageEvents((event) => {
      if (event.type === 'change') {
        loadTree();
      }
    });
    return () => unsubscribe();
  }, []);

  // Search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchFiles(searchQuery, searchContent);
        setSearchResults(results);
      } catch (err) {
        console.warn('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchContent]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Touch Long-press for Mobile Context Menu
  const handleTouchStart = (item: FileItem, e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimerRef.current = setTimeout(() => {
      setContextItem({ item, x: touch.clientX, y: touch.clientY });
    }, 550);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (item: FileItem, e: React.MouseEvent) => {
    e.preventDefault();
    setContextItem({ item, x: e.clientX, y: e.clientY });
  };

  // Actions
  const handleCreateFileSubmit = async () => {
    if (!inputValue.trim()) return;
    const parentDir = targetItem?.isDirectory ? targetItem.path : '/projects/Default';
    let fileName = inputValue.trim();
    if (!fileName.endsWith('.sql')) fileName += '.sql';
    const filePath = `${parentDir}/${fileName}`;
    await createFile(filePath, '-- New Query\n');
    setModalType(null);
    setInputValue('');
    await loadTree();
    onOpenFile({
      id: filePath,
      name: fileName,
      path: filePath,
      isDirectory: false,
    });
  };

  const handleCreateFolderSubmit = async () => {
    if (!inputValue.trim()) return;
    const parentDir = targetItem?.isDirectory ? targetItem.path : '/projects/Default';
    const folderPath = `${parentDir}/${inputValue.trim()}`;
    await createFolder(folderPath);
    setExpandedFolders((prev) => ({ ...prev, [folderPath]: true }));
    setModalType(null);
    setInputValue('');
    await loadTree();
  };

  const handleRenameSubmit = async () => {
    if (!inputValue.trim() || !targetItem) return;
    const lastSlash = targetItem.path.lastIndexOf('/');
    const dir = lastSlash >= 0 ? targetItem.path.substring(0, lastSlash) : '';
    const newName = inputValue.trim();
    const newPath = `${dir}/${newName}`;
    await renameItem(targetItem.path, newPath);
    onFileRenamed?.(targetItem.path, newPath, newName);
    setModalType(null);
    setInputValue('');
    await loadTree();
  };

  const handleDeleteSubmit = async () => {
    if (!targetItem) return;
    await deleteItem(targetItem.path);
    setModalType(null);
    setTargetItem(null);
    await loadTree();
  };

  const handleDuplicate = async (item: FileItem) => {
    await duplicateFile(item.path);
    await loadTree();
  };

  const handleExport = async (item: FileItem) => {
    await exportFile(item.path);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const parentDir = targetItem?.isDirectory ? targetItem.path : '/projects/Default';
      const newPath = await importFileFromDevice(file, parentDir);
      await loadTree();
      onOpenFile({
        id: newPath,
        name: file.name,
        path: newPath,
        isDirectory: false,
      });
    }
  };

  const handleGrantFolderAccess = async () => {
    const info = await requestDirectoryAccess();
    setStorageInfo(info);
    await loadTree();
  };

  // Render tree item
  const renderItem = (item: FileItem, depth = 0) => {
    const isExpanded = !!expandedFolders[item.path];
    const isSelected = activeFilePath === item.path;

    return (
      <div key={item.id} className="select-none">
        <div
          onClick={() => {
            if (item.isDirectory) {
              toggleFolder(item.path);
            } else {
              onOpenFile(item);
            }
          }}
          onContextMenu={(e) => handleContextMenu(item, e)}
          onTouchStart={(e) => handleTouchStart(item, e)}
          onTouchEnd={handleTouchEnd}
          className={`flex items-center justify-between group px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
            isSelected
              ? 'bg-blue-600/20 text-white font-medium border border-blue-500/30'
              : 'hover:bg-white/5 text-[#cccccc]'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 truncate">
            {item.isDirectory ? (
              <span className="text-[#858585] flex items-center">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-amber-400 ml-1 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-400 ml-1 shrink-0" />
                )}
              </span>
            ) : (
              <FileCode className="w-4 h-4 text-emerald-400 shrink-0 ml-4" />
            )}
            <span className="truncate font-mono text-[12px]">{item.name}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setContextItem({ item, x: e.clientX, y: e.clientY });
            }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 text-[#858585] hover:text-white hover:bg-white/10 transition-opacity"
            aria-label="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {item.isDirectory && isExpanded && item.children && (
          <div>{item.children.map((child) => renderItem(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-0 border-r select-none text-xs transition-colors"
      style={{
        backgroundColor: theme.bgSidebar,
        borderColor: theme.border,
        color: theme.textPrimary,
      }}
    >
      {/* Header & Quick Actions */}
      <div
        className="p-3 border-b space-y-3 shrink-0 transition-colors"
        style={{
          backgroundColor: theme.bgSecondary,
          borderColor: theme.border,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-white">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Local Files</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setTargetItem(null);
                setInputValue('');
                setModalType('newFile');
              }}
              title="New SQL File"
              className="p-1.5 rounded-lg bg-[#252526] hover:bg-[#333333] text-[#cccccc] hover:text-white transition-colors border border-[#3d3d3d]"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              onClick={() => {
                setTargetItem(null);
                setInputValue('');
                setModalType('newFolder');
              }}
              title="New Folder"
              className="p-1.5 rounded-lg bg-[#252526] hover:bg-[#333333] text-[#cccccc] hover:text-white transition-colors border border-[#3d3d3d]"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import File from Device"
              className="p-1.5 rounded-lg bg-[#252526] hover:bg-[#333333] text-[#cccccc] hover:text-white transition-colors border border-[#3d3d3d]"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
            </button>
            <button
              onClick={loadTree}
              title="Refresh"
              className="p-1.5 rounded-lg bg-[#252526] hover:bg-[#333333] text-[#cccccc] hover:text-white transition-colors border border-[#3d3d3d]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Storage Location & Permission Badge */}
        <div className="p-2.5 rounded-lg bg-[#181818] border border-[#2d2d2d] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#858585] flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              Storage Engine:
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                storageInfo.permission === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {storageInfo.permission === 'granted' ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400" />
              )}
              {storageInfo.permission.toUpperCase()}
            </span>
          </div>

          <div className="text-[11px] font-mono text-white truncate" title={storageInfo.location}>
            {storageInfo.location}
          </div>

          {typeof window !== 'undefined' && 'showDirectoryPicker' in window && (
            <button
              onClick={handleGrantFolderAccess}
              className="w-full mt-1 py-1 rounded bg-[#252526] hover:bg-[#333333] text-blue-400 hover:text-blue-300 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 border border-[#3d3d3d]"
            >
              <FolderInput className="w-3 h-3" />
              <span>{storageInfo.type === 'fsa' ? 'Switch Local Directory' : 'Grant Directory Access'}</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#858585] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-[#181818] border border-[#333333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#858585] focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#858585] px-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={searchContent}
                onChange={(e) => setSearchContent(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 bg-[#181818] border-[#333333]"
              />
              <span>Search inside SQL code</span>
            </label>
            {isSearching && <span className="text-emerald-400 text-[10px]">Searching...</span>}
          </div>
        </div>
      </div>

      {/* Explorer Tree or Search Results */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {searchResults !== null ? (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-[#858585] flex items-center justify-between">
              <span>SEARCH RESULTS ({searchResults.length})</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-400 hover:text-blue-300 text-[10px]"
              >
                Clear
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#858585]">No matching files found</div>
            ) : (
              searchResults.map((item) => renderItem(item, 0))
            )}
          </div>
        ) : files.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#858585] space-y-2">
            <p>No project files found.</p>
            <button
              onClick={() => {
                setTargetItem(null);
                setInputValue('');
                setModalType('newFile');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-500 transition-colors"
            >
              + Create First File
            </button>
          </div>
        ) : (
          files.map((item) => renderItem(item, 0))
        )}
      </div>

      {/* Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sql,.txt,.json,.csv"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Context Menu Dropdown */}
      {contextItem && (
        <div
          className="fixed inset-0 z-50 bg-transparent"
          onClick={() => setContextItem(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextItem(null);
          }}
        >
          <div
            className="absolute z-50 bg-[#252526] border border-[#333333] rounded-xl shadow-2xl p-1 w-48 text-xs text-[#cccccc] space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: Math.min(contextItem.y, window.innerHeight - 240),
              left: Math.min(contextItem.x, window.innerWidth - 200),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 border-b border-[#333333] font-mono text-[11px] text-white truncate">
              {contextItem.item.name}
            </div>

            {contextItem.item.isDirectory ? (
              <>
                <button
                  onClick={() => {
                    setTargetItem(contextItem.item);
                    setInputValue('');
                    setModalType('newFile');
                    setContextItem(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#333333] hover:text-white text-left"
                >
                  <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New File Here</span>
                </button>
                <button
                  onClick={() => {
                    setTargetItem(contextItem.item);
                    setInputValue('');
                    setModalType('newFolder');
                    setContextItem(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#333333] hover:text-white text-left"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Folder Here</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onOpenFile(contextItem.item);
                    setContextItem(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#333333] hover:text-white text-left"
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open in Editor</span>
                </button>
                <button
                  onClick={() => {
                    handleDuplicate(contextItem.item);
                    setContextItem(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#333333] hover:text-white text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => {
                    handleExport(contextItem.item);
                    setContextItem(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#333333] hover:text-white text-left"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Export / Share</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                setTargetItem(contextItem.item);
                setInputValue(contextItem.item.name);
                setModalType('rename');
                setContextItem(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#333333] hover:text-white text-left"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rename</span>
            </button>

            <div className="border-t border-[#333333] my-1" />

            <button
              onClick={() => {
                setTargetItem(contextItem.item);
                setModalType('delete');
                setContextItem(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals for New File / Folder / Rename / Delete */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#252526] border border-[#333333] rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-semibold text-white text-sm">
              {modalType === 'newFile' && 'Create New SQL File'}
              {modalType === 'newFolder' && 'Create New Folder'}
              {modalType === 'rename' && `Rename ${targetItem?.name}`}
              {modalType === 'delete' && 'Confirm Delete'}
            </h3>

            {modalType === 'delete' ? (
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-white font-mono">{targetItem?.name}</strong>?
                {targetItem?.isDirectory && ' All contained files will also be removed.'}
              </p>
            ) : (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  modalType === 'newFile'
                    ? 'e.g. analytics_summary.sql'
                    : modalType === 'newFolder'
                    ? 'e.g. reports'
                    : 'New name'
                }
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (modalType === 'newFile') handleCreateFileSubmit();
                    if (modalType === 'newFolder') handleCreateFolderSubmit();
                    if (modalType === 'rename') handleRenameSubmit();
                  }
                }}
                className="w-full bg-[#181818] border border-[#333333] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setTargetItem(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-[#333333] text-[#cccccc] hover:bg-[#444444]"
              >
                Cancel
              </button>
              {modalType === 'delete' ? (
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  className="px-3.5 py-1.5 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-semibold"
                >
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (modalType === 'newFile') handleCreateFileSubmit();
                    if (modalType === 'newFolder') handleCreateFolderSubmit();
                    if (modalType === 'rename') handleRenameSubmit();
                  }}
                  disabled={!inputValue.trim()}
                  className="px-3.5 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
