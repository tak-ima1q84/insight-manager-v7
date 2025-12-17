import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Insight {
  id: number;
  creationNumber: number;
  subject: string;
  insightId: string;
  status: string;
  type: string;
  mainCategory: string;
  subCategory: string;
  dataCategory: string;
  maintenanceDate: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [masters, setMasters] = useState<any[]>([]);
  const [view, setView] = useState<'login' | 'list' | 'detail' | 'masters' | 'new' | 'edit' | 'imagePreview'>('login');
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [imagePreview, setImagePreview] = useState<{ teaser: string; story: string[] } | null>(null);
  const [searchParams, setSearchParams] = useState({
    creationNumber: '',
    subject: '',
    insightId: '',
    status: '',
    type: '',
    mainCategory: '',
    subCategory: '',
    dataCategory: '',
    logicFormula: '',
    targetBanks: [] as string[],
    targetTables: [] as string[],
    relatedInsight: '',
    maintenanceDate: '',
  });

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setView('list');
      loadInsights();
      loadMasters();
    }
  };

  const loadInsights = async (params = searchParams) => {
    // Create query string manually to avoid URLSearchParams issues in server environment
    const queryParts: string[] = [];
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => v && queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
      } else if (value) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`);
      }
    });
    const queryString = queryParts.join('&');
    const res = await fetch(`/api/insights${queryString ? '?' + queryString : ''}`);
    const data = await res.json();
    setInsights(data);
  };

  const loadMasters = async () => {
    const res = await fetch('/api/masters');
    const data = await res.json();
    setMasters(data);
  };

  const downloadCSV = async () => {
    window.location.href = '/api/insights/export/csv';
  };

  if (view === 'login') {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="app">
      <header>
        <h1>インサイト管理ツール</h1>
        <div>
          <span>{user?.username} ({user?.role})</span>
          <button onClick={() => setView('list')}>一覧</button>
          {user?.role === 'Admin' && (
            <button onClick={() => setView('masters')}>マスタ管理</button>
          )}
          <button onClick={() => { setUser(null); setView('login'); }}>ログアウト</button>
        </div>
      </header>
      
      {view === 'list' && (
        <InsightList
          insights={insights}
          onRefresh={() => loadInsights()}
          onSelect={(insight) => { setSelectedInsight(insight); setView('detail'); }}
          onEdit={(insight) => { setSelectedInsight(insight); setView('edit'); }}
          onDownloadCSV={downloadCSV}
          onNew={() => setView('new')}
          onImagePreview={(insight: any) => {
            setImagePreview({ teaser: insight.teaserImage || '', story: insight.storyImages || [] });
            setView('imagePreview');
          }}
          onSearch={(params) => { setSearchParams(params); loadInsights(params); }}
          searchParams={searchParams}
          masters={masters}
          userRole={user?.role || ''}
        />
      )}
      
      {view === 'detail' && selectedInsight && (
        <InsightDetail
          insight={selectedInsight}
          masters={masters}
          onBack={() => setView('list')}
          onSave={loadInsights}
          userRole={user?.role || ''}
        />
      )}
      
      {view === 'new' && (
        <InsightForm
          masters={masters}
          onBack={() => setView('list')}
          onSave={() => { loadInsights(); setView('list'); }}
          userRole={user?.role || ''}
        />
      )}
      
      {view === 'edit' && selectedInsight && (
        <InsightForm
          insight={selectedInsight}
          masters={masters}
          onBack={() => setView('list')}
          onSave={() => { loadInsights(); setView('list'); }}
          userRole={user?.role || ''}
        />
      )}
      
      {view === 'imagePreview' && imagePreview && (
        <ImagePreview
          teaserImage={imagePreview.teaser}
          storyImages={imagePreview.story}
          onClose={() => setView('list')}
        />
      )}
      
      {view === 'masters' && user?.role === 'Admin' && (
        <MasterManagement masters={masters} onRefresh={loadMasters} />
      )}
    </div>
  );
};

const LoginScreen: React.FC<{ onLogin: (u: string, p: string) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="login">
      <h2>ログイン</h2>
      <input
        type="text"
        placeholder="ユーザー名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => onLogin(username, password)}>ログイン</button>
    </div>
  );
};

const InsightList: React.FC<{
  insights: Insight[];
  onRefresh: () => void;
  onSelect: (insight: Insight) => void;
  onEdit: (insight: Insight) => void;
  onDownloadCSV: () => void;
  onNew: () => void;
  onImagePreview: (insight: any) => void;
  onSearch: (params: any) => void;
  searchParams: any;
  masters: any[];
  userRole: string;
}> = ({ insights, onRefresh, onSelect, onEdit, onDownloadCSV, onNew, onImagePreview, onSearch, searchParams, masters, userRole }) => {
  const getMasterOptions = (categoryKey: string) => {
    return masters.filter(m => m.categoryKey === categoryKey);
  };

  // Helper function to get Japanese label from master data
  const getMasterLabel = (categoryKey: string, value: string) => {
    const option = masters.find(m => m.categoryKey === categoryKey && m.optionValue === value);
    return option ? option.optionLabel : value;
  };

  // Helper function to get Japanese labels for array values (like targetBanks)
  const getMasterLabels = (categoryKey: string, values: string[]) => {
    if (!values || !Array.isArray(values)) return 'なし';
    const labels = values.map(value => getMasterLabel(categoryKey, value));
    return labels.join(', ');
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/insights/import/csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      
      if (result.success) {
        let message = `インポート完了\n成功: ${result.imported}件\nエラー: ${result.errors}件`;
        
        if (result.errors > 0 && result.errorDetails && result.errorDetails.length > 0) {
          message += '\n\nエラー詳細:';
          result.errorDetails.slice(0, 5).forEach((err: any) => {
            message += `\n行 ${err.row}: ${err.error}`;
          });
          if (result.errorDetails.length > 5) {
            message += `\n... 他 ${result.errorDetails.length - 5} 件のエラー`;
          }
        }
        
        alert(message);
        onRefresh();
      } else {
        alert('インポート失敗: ' + result.error);
      }
    } catch (error) {
      alert('インポート中にエラーが発生しました: ' + String(error));
    }

    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="insight-list">
      <div className="search-panel">
        <h3>検索条件</h3>
        <div className="search-form">
          <label>
            作成番号:
            <input
              type="number"
              value={searchParams.creationNumber}
              onChange={(e) => onSearch({ ...searchParams, creationNumber: e.target.value })}
            />
          </label>
          <label>
            件名:
            <input
              type="text"
              value={searchParams.subject}
              onChange={(e) => onSearch({ ...searchParams, subject: e.target.value })}
              placeholder="部分一致"
            />
          </label>
          <label>
            インサイトID:
            <input
              type="text"
              value={searchParams.insightId}
              onChange={(e) => onSearch({ ...searchParams, insightId: e.target.value })}
              placeholder="部分一致"
            />
          </label>
          <label>
            ステータス:
            <select
              value={searchParams.status}
              onChange={(e) => onSearch({ ...searchParams, status: e.target.value })}
            >
              <option value="">全て</option>
              {getMasterOptions('status').map((opt) => (
                <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
              ))}
            </select>
          </label>
          <label>
            タイプ:
            <select
              value={searchParams.type}
              onChange={(e) => onSearch({ ...searchParams, type: e.target.value })}
            >
              <option value="">全て</option>
              {getMasterOptions('insight_type').map((opt) => (
                <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
              ))}
            </select>
          </label>
          <label>
            メインカテゴリ:
            <select
              value={searchParams.mainCategory}
              onChange={(e) => onSearch({ ...searchParams, mainCategory: e.target.value })}
            >
              <option value="">全て</option>
              {getMasterOptions('main_category').map((opt) => (
                <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
              ))}
            </select>
          </label>
          <label>
            データカテゴリ:
            <select
              value={searchParams.dataCategory}
              onChange={(e) => onSearch({ ...searchParams, dataCategory: e.target.value })}
            >
              <option value="">全て</option>
              {getMasterOptions('data_category').map((opt) => (
                <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
              ))}
            </select>
          </label>
          <label>
            表示ロジック (m1-1):
            <input
              type="text"
              value={searchParams.logicFormula}
              onChange={(e) => onSearch({ ...searchParams, logicFormula: e.target.value })}
              placeholder="部分一致"
            />
          </label>
          <label>
            関連インサイト (o1):
            <input
              type="text"
              value={searchParams.relatedInsight}
              onChange={(e) => onSearch({ ...searchParams, relatedInsight: e.target.value })}
              placeholder="部分一致"
            />
          </label>
          <div className="checkbox-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
              金融データ利用銀行 (l1):
            </label>
            <div className="checkbox-list">
              {getMasterOptions('target_banks').map((opt) => (
                <label key={opt.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={searchParams.targetBanks.includes(opt.optionValue)}
                    onChange={(e) => {
                      const newBanks = e.target.checked
                        ? [...searchParams.targetBanks, opt.optionValue]
                        : searchParams.targetBanks.filter(v => v !== opt.optionValue);
                      onSearch({ ...searchParams, targetBanks: newBanks });
                    }}
                  />
                  <span>{opt.optionLabel}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="checkbox-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
              使用データテーブル (m1-2):
            </label>
            <div className="checkbox-list">
              {getMasterOptions('target_tables').map((opt) => (
                <label key={opt.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={searchParams.targetTables.includes(opt.optionValue)}
                    onChange={(e) => {
                      const newTables = e.target.checked
                        ? [...searchParams.targetTables, opt.optionValue]
                        : searchParams.targetTables.filter(v => v !== opt.optionValue);
                      onSearch({ ...searchParams, targetTables: newTables });
                    }}
                  />
                  <span>{opt.optionLabel}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', alignItems: 'end' }}>
            <button 
              onClick={() => onSearch(searchParams)}
              style={{ background: '#27ae60', padding: '0.6rem 2rem' }}
            >
              検索
            </button>
            <button onClick={() => onSearch({
              creationNumber: '',
              subject: '',
              insightId: '',
              status: '',
              type: '',
              mainCategory: '',
              subCategory: '',
              dataCategory: '',
              logicFormula: '',
              targetBanks: [],
              targetTables: [],
              relatedInsight: '',
              maintenanceDate: '',
            })}>クリア</button>
          </div>
        </div>
      </div>
      
      <div className="toolbar">
        <button onClick={onRefresh}>更新</button>
        {(userRole === 'Admin' || userRole === 'Manager') && (
          <>
            <button onClick={onDownloadCSV}>CSV ダウンロード</button>
            <label htmlFor="csv-import" style={{ 
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: '#27ae60',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}>
              CSV インポート
            </label>
            <input
              id="csv-import"
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              style={{ display: 'none' }}
            />
            <button onClick={onNew}>新規登録</button>
          </>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th>作成番号</th>
            <th>件名</th>
            <th>ID</th>
            <th>ステータス</th>
            <th>タイプ</th>
            <th>メインカテゴリ</th>
            <th>サブカテゴリ</th>
            <th>データカテゴリ</th>
            <th>メンテナンス日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {insights.map((insight) => (
            <tr key={insight.id}>
              <td>{insight.creationNumber}</td>
              <td onClick={() => onSelect(insight)} style={{ cursor: 'pointer' }}>{insight.subject}</td>
              <td>{insight.insightId}</td>
              <td>{getMasterLabel('status', insight.status)}</td>
              <td>{getMasterLabel('insight_type', insight.type)}</td>
              <td>{getMasterLabel('main_category', insight.mainCategory)}</td>
              <td>{insight.subCategory}</td>
              <td>{getMasterLabel('data_category', insight.dataCategory)}</td>
              <td>{insight.maintenanceDate}</td>
              <td>
                <button onClick={(e) => { e.stopPropagation(); onSelect(insight); }} style={{ marginRight: '0.5rem' }}>
                  閲覧
                </button>
                <button onClick={(e) => { e.stopPropagation(); onImagePreview(insight); }} style={{ marginRight: '0.5rem' }}>
                  画像
                </button>
                {(userRole === 'Admin' || userRole === 'Manager') && (
                  <button onClick={(e) => { e.stopPropagation(); onEdit(insight); }}>
                    編集
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InsightDetail: React.FC<{
  insight: Insight;
  masters: any[];
  onBack: () => void;
  onSave: () => void;
  onDelete?: () => void;
  userRole: string;
}> = ({ insight, masters, onBack, onSave, onDelete, userRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [formData, setFormData] = useState<any>(insight);

  const getMasterOptions = (categoryKey: string) => {
    return masters.filter(m => m.categoryKey === categoryKey);
  };

  // Helper function to get Japanese label from master data
  const getMasterLabel = (categoryKey: string, value: string) => {
    const option = masters.find(m => m.categoryKey === categoryKey && m.optionValue === value);
    return option ? option.optionLabel : value;
  };

  // Helper function to get Japanese labels for array values (like targetBanks)
  const getMasterLabels = (categoryKey: string, values: string[]) => {
    if (!values || !Array.isArray(values)) return 'なし';
    const labels = values.map(value => getMasterLabel(categoryKey, value));
    return labels.join(', ');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Clean up the data before sending
    const cleanedData = {
      ...formData,
      // Convert score to number or null
      score: formData.score ? parseFloat(formData.score) : null,
      // Ensure arrays are properly formatted
      targetBanks: Array.isArray(formData.targetBanks) ? formData.targetBanks : [],
      targetTables: Array.isArray(formData.targetTables) ? formData.targetTables : [],
      storyImages: Array.isArray(formData.storyImages) 
        ? formData.storyImages.filter((img: string) => img && img.trim() !== '') 
        : [],
      // Convert counts to numbers
      displayCount: parseInt(formData.displayCount) || 1,
      selectCount: parseInt(formData.selectCount) || 1,
      creationNumber: parseInt(formData.creationNumber) || 1,
    };
    
    const res = await fetch(`/api/insights/${insight.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cleanedData),
    });
    
    if (res.ok) {
      alert('更新しました');
      setIsEditing(false);
      onSave();
    } else {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Update error:', errorData);
      alert(`更新できませんでした: ${errorData.error || 'エラーが発生しました'}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当に削除しますか？')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/insights/${insight.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      alert('削除しました');
      onBack();
    } else {
      alert('削除に失敗しました');
    }
  };

  const canEdit = userRole === 'Admin' || userRole === 'Manager';

  if (!isEditing) {
    return (
      <div className="insight-detail">
        <div className="toolbar">
          <button onClick={onBack}>戻る</button>
          {canEdit && <button onClick={() => setIsEditing(true)}>編集</button>}
          {canEdit && <button onClick={handleDelete} style={{ background: '#e74c3c' }}>削除</button>}
          <button onClick={() => setShowImagePreview(true)}>画像プレビュー</button>
        </div>
        <h2>インサイト詳細</h2>
        <div className="form">
          <label>作成番号: {insight.creationNumber}</label>
          <label>件名: {insight.subject}</label>
          <label>ID: {insight.insightId}</label>
          <label>ステータス: {getMasterLabel('status', insight.status)}</label>
          <label>配信開始日: {insight.startDate}</label>
          <label>更新日: {insight.updateDate}</label>
          <label>配信停止日: {insight.endDate}</label>
          <label>タイプ: {getMasterLabel('insight_type', insight.type)}</label>
          <label>メインカテゴリ: {getMasterLabel('main_category', insight.mainCategory)}</label>
          <label>サブカテゴリ: {insight.subCategory}</label>
          <label>データカテゴリ: {getMasterLabel('data_category', insight.dataCategory)}</label>
          <label>金融データ利用銀行 (l1): {getMasterLabels('target_banks', insight.targetBanks)}</label>
          <label>表示ロジック (m1-1): {insight.logicFormula}</label>
          <label>使用データテーブル (m1-2): {getMasterLabels('target_tables', insight.targetTables)}</label>
          <label>対象ユーザー: {insight.targetUsers}</label>
          <label>関連インサイト: {insight.relatedInsight}</label>
          <label>収益カテゴリ: {getMasterLabel('revenue_category', insight.revenueCategory)}</label>
          <label>アイコンタイプ: {getMasterLabel('icon_type', insight.iconType)}</label>
          <label>スコア: {insight.score}</label>
          <label>関連性ポリシー: {getMasterLabel('relevance_policy', insight.relevancePolicy)}</label>
          <label>関連性スコア: {insight.relevanceScore}</label>
          <label>表示回数: {insight.displayCount}</label>
          <label>選択回数: {insight.selectCount}</label>
          <label>次回表示ポリシー: {getMasterLabel('next_policy', insight.nextPolicy)}</label>
          <label>次回表示設定値: {insight.nextValue}</label>
          <label>アプリ内遷移先: {insight.appLink}</label>
          <label>外部遷移先: {insight.externalLink}</label>
          <label>ティーザー画像 (a2): {insight.teaserImage || 'なし'}</label>
          {insight.teaserImage && (
            <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
              <img src={insight.teaserImage} alt="Teaser" style={{ maxWidth: '200px', border: '1px solid #ddd' }} />
            </div>
          )}
          <label>ストーリー画像 (b2): {insight.storyImages && insight.storyImages.length > 0 ? `${insight.storyImages.length}枚` : 'なし'}</label>
          {insight.storyImages && insight.storyImages.length > 0 && (
            <div style={{ marginLeft: '1rem', marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {insight.storyImages.map((img: string, idx: number) => (
                <img key={idx} src={img} alt={`Story ${idx + 1}`} style={{ maxWidth: '150px', border: '1px solid #ddd' }} />
              ))}
            </div>
          )}
          <label>メンテナンス日: {insight.maintenanceDate}</label>
          <label>メンテナンス理由: {insight.maintenanceReason}</label>
          <label>備考: {insight.remarks}</label>
          <label>更新者: {insight.updatedBy}</label>
        </div>
        {showImagePreview && (
          <ImagePreview
            teaserImage={insight.teaserImage}
            storyImages={insight.storyImages}
            onClose={() => setShowImagePreview(false)}
          />
        )}
      </div>
    );
  }

  // 編集モード - InsightFormと同じフォームを表示
  return (
    <div className="insight-form">
      <button onClick={() => setIsEditing(false)}>キャンセル</button>
      <h2>インサイト編集</h2>
      <form onSubmit={handleUpdate} className="form">
        <label>
          作成番号:
          <input
            type="number"
            value={formData.creationNumber}
            onChange={(e) => setFormData({ ...formData, creationNumber: Number(e.target.value) })}
            min="1"
            max="19999"
            required
          />
        </label>

        <label>
          件名:
          <input
            type="text"
            value={formData.subject || ''}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </label>

        <label>
          インサイトID:
          <input
            type="text"
            value={formData.insightId || ''}
            onChange={(e) => setFormData({ ...formData, insightId: e.target.value })}
            required
          />
        </label>

        <label>
          ステータス:
          <select
            value={formData.status || ''}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            {getMasterOptions('status').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          配信開始日:
          <input
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </label>

        <label>
          配信停止日:
          <input
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </label>

        <label>
          タイプ:
          <select
            value={formData.type || ''}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            {getMasterOptions('insight_type').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          メインカテゴリ:
          <select
            value={formData.mainCategory || ''}
            onChange={(e) => setFormData({ ...formData, mainCategory: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            {getMasterOptions('main_category').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          サブカテゴリ:
          <input
            type="text"
            value={formData.subCategory || ''}
            onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
          />
        </label>

        <label>
          データカテゴリ:
          <select
            value={formData.dataCategory || ''}
            onChange={(e) => setFormData({ ...formData, dataCategory: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            {getMasterOptions('data_category').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          表示ロジック:
          <textarea
            value={formData.logicFormula || ''}
            onChange={(e) => setFormData({ ...formData, logicFormula: e.target.value })}
            rows={3}
          />
        </label>

        <label>
          備考:
          <input
            type="text"
            value={formData.remarks || ''}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            maxLength={200}
          />
        </label>

        <label>
          更新者:
          <input
            type="text"
            value={formData.updatedBy || ''}
            onChange={(e) => setFormData({ ...formData, updatedBy: e.target.value })}
          />
        </label>

        <div style={{ marginTop: '2rem' }}>
          <button type="submit">更新</button>
          <button type="button" onClick={() => setIsEditing(false)} style={{ marginLeft: '1rem' }}>キャンセル</button>
        </div>
      </form>
    </div>
  );
};

const MasterManagement: React.FC<{
  masters: any[];
  onRefresh: () => void;
}> = ({ masters, onRefresh }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newData, setNewData] = useState({
    categoryKey: '',
    optionValue: '',
    optionLabel: '',
    sortOrder: 0,
  });

  const handleEdit = (master: any) => {
    setEditingId(master.id);
    setEditData(master);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/masters/${editingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      alert('更新しました');
      setEditingId(null);
      onRefresh();
    } else {
      alert('更新に失敗しました');
    }
  };

  const handleCreate = async () => {
    if (!newData.categoryKey || !newData.optionValue || !newData.optionLabel) {
      alert('全ての項目を入力してください');
      return;
    }
    const token = localStorage.getItem('token');
    const res = await fetch('/api/masters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(newData),
    });
    if (res.ok) {
      alert('作成しました');
      setIsCreating(false);
      setNewData({ categoryKey: '', optionValue: '', optionLabel: '', sortOrder: 0 });
      onRefresh();
    } else {
      alert('作成に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除してもよろしいですか？')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/masters/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      alert('削除しました');
      onRefresh();
    } else {
      alert('削除に失敗しました');
    }
  };

  // Remove duplicates based on id
  const uniqueMasters = masters.filter((master, index, self) =>
    index === self.findIndex((m) => m.id === master.id)
  );

  return (
    <div className="master-management">
      <h2>マスタ管理</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={onRefresh}>更新</button>
        <button onClick={() => setIsCreating(!isCreating)} style={{ marginLeft: '0.5rem', background: '#27ae60' }}>
          {isCreating ? 'キャンセル' : '新規作成'}
        </button>
      </div>
      
      {isCreating && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0f8ff', border: '1px solid #3498db', borderRadius: '4px' }}>
          <h3>新規マスタ作成</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>カテゴリキー:</label>
              <input
                value={newData.categoryKey}
                onChange={(e) => setNewData({...newData, categoryKey: e.target.value})}
                placeholder="例: status"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>値:</label>
              <input
                value={newData.optionValue}
                onChange={(e) => setNewData({...newData, optionValue: e.target.value})}
                placeholder="例: active"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>ラベル:</label>
              <input
                value={newData.optionLabel}
                onChange={(e) => setNewData({...newData, optionLabel: e.target.value})}
                placeholder="例: アクティブ"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>順序:</label>
              <input
                type="number"
                value={newData.sortOrder}
                onChange={(e) => setNewData({...newData, sortOrder: Number(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <button onClick={handleCreate} style={{ marginTop: '1rem', background: '#27ae60' }}>作成</button>
        </div>
      )}
      
      <table>
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th>値</th>
            <th>ラベル</th>
            <th>順序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {uniqueMasters.map((master) => (
            <tr key={master.id}>
              {editingId === master.id ? (
                <>
                  <td><input value={editData.categoryKey} onChange={(e) => setEditData({...editData, categoryKey: e.target.value})} /></td>
                  <td><input value={editData.optionValue} onChange={(e) => setEditData({...editData, optionValue: e.target.value})} /></td>
                  <td><input value={editData.optionLabel} onChange={(e) => setEditData({...editData, optionLabel: e.target.value})} /></td>
                  <td><input type="number" value={editData.sortOrder} onChange={(e) => setEditData({...editData, sortOrder: Number(e.target.value)})} /></td>
                  <td>
                    <button onClick={handleSave}>保存</button>
                    <button onClick={() => setEditingId(null)}>キャンセル</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{master.categoryKey}</td>
                  <td>{master.optionValue}</td>
                  <td>{master.optionLabel}</td>
                  <td>{master.sortOrder}</td>
                  <td>
                    <button onClick={() => handleEdit(master)}>編集</button>
                    <button onClick={() => handleDelete(master.id)}>削除</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InsightForm: React.FC<{
  insight?: any;
  masters: any[];
  onBack: () => void;
  onSave: () => void;
  userRole: string;
}> = ({ insight, masters, onBack, onSave }) => {
  const isEdit = !!insight;
  const [formData, setFormData] = useState(insight || {
    creationNumber: 1,
    subject: '',
    insightId: '',
    status: '',
    startDate: '',
    updateDate: '',
    endDate: '',
    type: '',
    mainCategory: '',
    subCategory: '',
    dataCategory: '',
    targetBanks: [] as string[],
    logicFormula: '',
    targetTables: [] as string[],
    targetUsers: '',
    relatedInsight: '',
    revenueCategory: '',
    iconType: '',
    score: '',
    relevancePolicy: '',
    relevanceScore: '',
    displayCount: 1,
    selectCount: 1,
    nextPolicy: '',
    nextValue: '',
    appLink: '',
    externalLink: '',
    teaserImage: '',
    storyImages: [] as string[],
    maintenanceDate: '2099-12-31',
    maintenanceReason: '',
    remarks: '',
    updatedBy: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEdit ? `/api/insights/${insight.id}` : '/api/insights';
    const method = isEdit ? 'PUT' : 'POST';
    
    // Clean up the data before sending
    const cleanedData = {
      ...formData,
      // Convert score to number or null
      score: formData.score ? parseFloat(formData.score) : null,
      // Ensure arrays are properly formatted
      targetBanks: Array.isArray(formData.targetBanks) ? formData.targetBanks : [],
      targetTables: Array.isArray(formData.targetTables) ? formData.targetTables : [],
      storyImages: Array.isArray(formData.storyImages) 
        ? formData.storyImages.filter((img: string) => img && img.trim() !== '') 
        : [],
      // Convert counts to numbers
      displayCount: parseInt(formData.displayCount) || 1,
      selectCount: parseInt(formData.selectCount) || 1,
      creationNumber: parseInt(formData.creationNumber) || 1,
    };
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cleanedData),
    });
    
    if (res.ok) {
      alert(isEdit ? '更新しました' : '登録しました');
      onSave();
    } else {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Update error:', errorData);
      alert(isEdit ? `更新できませんでした: ${errorData.error || 'エラーが発生しました'}` : `登録できませんでした: ${errorData.error || 'エラーが発生しました'}`);
    }
  };

  const getMasterOptions = (categoryKey: string) => {
    return masters.filter(m => m.categoryKey === categoryKey);
  };

  // Helper function to get Japanese label from master data
  const getMasterLabel = (categoryKey: string, value: string) => {
    const option = masters.find(m => m.categoryKey === categoryKey && m.optionValue === value);
    return option ? option.optionLabel : value;
  };

  return (
    <div className="insight-form">
      <button onClick={onBack}>戻る</button>
      <h2>{isEdit ? 'インサイト編集' : 'インサイト新規登録'}</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          作成番号:
          <input
            type="number"
            value={formData.creationNumber}
            onChange={(e) => setFormData({ ...formData, creationNumber: Number(e.target.value) })}
            min="1"
            max="19999"
            required
          />
        </label>

        <label>
          件名:
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </label>

        <label>
          インサイトID:
          <input
            type="text"
            value={formData.insightId}
            onChange={(e) => setFormData({ ...formData, insightId: e.target.value })}
            required
          />
        </label>

        <label>
          ステータス:
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            {getMasterOptions('status').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          配信開始日:
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </label>

        <label>
          配信停止日:
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </label>

        <label>
          タイプ:
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            {getMasterOptions('insight_type').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          メインカテゴリ:
          <select
            value={formData.mainCategory}
            onChange={(e) => setFormData({ ...formData, mainCategory: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            {getMasterOptions('main_category').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          サブカテゴリ:
          <input
            type="text"
            value={formData.subCategory}
            onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
          />
        </label>

        <label>
          データカテゴリ:
          <select
            value={formData.dataCategory}
            onChange={(e) => setFormData({ ...formData, dataCategory: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            {getMasterOptions('data_category').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          更新日:
          <input
            type="date"
            value={formData.updateDate}
            onChange={(e) => setFormData({ ...formData, updateDate: e.target.value })}
          />
        </label>

        <label>
          金融データ利用銀行（複数選択可）:
          <div className="form-checkbox-container">
            {getMasterOptions('target_banks').map((opt) => (
              <label key={opt.id} className="form-checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.targetBanks.includes(opt.optionValue)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, targetBanks: [...formData.targetBanks, opt.optionValue] });
                    } else {
                      setFormData({ ...formData, targetBanks: formData.targetBanks.filter(v => v !== opt.optionValue) });
                    }
                  }}
                />
                <span>{opt.optionLabel}</span>
              </label>
            ))}
          </div>
        </label>

        <label>
          表示ロジック:
          <textarea
            value={formData.logicFormula}
            onChange={(e) => setFormData({ ...formData, logicFormula: e.target.value })}
            rows={3}
          />
        </label>

        <label>
          使用データテーブル（複数選択可）:
          <div className="form-checkbox-container">
            {getMasterOptions('target_tables').map((opt) => (
              <label key={opt.id} className="form-checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.targetTables.includes(opt.optionValue)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, targetTables: [...formData.targetTables, opt.optionValue] });
                    } else {
                      setFormData({ ...formData, targetTables: formData.targetTables.filter(v => v !== opt.optionValue) });
                    }
                  }}
                />
                <span>{opt.optionLabel}</span>
              </label>
            ))}
          </div>
        </label>

        <label>
          対象ユーザー（箇条書き）:
          <textarea
            value={formData.targetUsers}
            onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
            rows={3}
            placeholder="・ユーザー1&#10;・ユーザー2"
          />
        </label>

        <label>
          関連インサイト:
          <input
            type="text"
            value={formData.relatedInsight}
            onChange={(e) => setFormData({ ...formData, relatedInsight: e.target.value })}
            maxLength={200}
          />
        </label>

        <label>
          収益カテゴリ:
          <select
            value={formData.revenueCategory}
            onChange={(e) => setFormData({ ...formData, revenueCategory: e.target.value })}
          >
            <option value="">選択してください</option>
            {getMasterOptions('revenue_category').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          アイコンタイプ:
          <select
            value={formData.iconType}
            onChange={(e) => setFormData({ ...formData, iconType: e.target.value })}
          >
            <option value="">選択してください</option>
            {getMasterOptions('icon_type').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          スコア:
          <input
            type="number"
            step="0.01"
            value={formData.score}
            onChange={(e) => setFormData({ ...formData, score: e.target.value })}
          />
        </label>

        <label>
          関連性ポリシータイプ:
          <select
            value={formData.relevancePolicy}
            onChange={(e) => setFormData({ ...formData, relevancePolicy: e.target.value })}
          >
            <option value="">選択してください</option>
            {getMasterOptions('relevance_policy').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          関連性スコア:
          <input
            type="text"
            value={formData.relevanceScore}
            onChange={(e) => setFormData({ ...formData, relevanceScore: e.target.value })}
          />
        </label>

        <label>
          表示回数:
          <input
            type="number"
            value={formData.displayCount}
            onChange={(e) => setFormData({ ...formData, displayCount: Number(e.target.value) })}
            min="1"
            max="99"
          />
        </label>

        <label>
          選択回数:
          <input
            type="number"
            value={formData.selectCount}
            onChange={(e) => setFormData({ ...formData, selectCount: Number(e.target.value) })}
            min="1"
            max="99"
          />
        </label>

        <label>
          次回表示ポリシー:
          <select
            value={formData.nextPolicy}
            onChange={(e) => setFormData({ ...formData, nextPolicy: e.target.value })}
          >
            <option value="">選択してください</option>
            {getMasterOptions('next_policy').map((opt) => (
              <option key={opt.id} value={opt.optionValue}>{opt.optionLabel}</option>
            ))}
          </select>
        </label>

        <label>
          次回表示設定値:
          <input
            type="text"
            value={formData.nextValue}
            onChange={(e) => setFormData({ ...formData, nextValue: e.target.value })}
            maxLength={200}
          />
        </label>

        <label>
          アプリ内遷移先:
          <input
            type="text"
            value={formData.appLink}
            onChange={(e) => setFormData({ ...formData, appLink: e.target.value })}
          />
        </label>

        <label>
          外部遷移先:
          <input
            type="url"
            value={formData.externalLink}
            onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
            placeholder="https://example.com"
          />
        </label>

        <label>
          ティーザー画面画像 (a2):
          <input
            type="text"
            value={formData.teaserImage || ''}
            onChange={(e) => setFormData({ ...formData, teaserImage: e.target.value })}
            placeholder="URLを入力 または ファイルをアップロード"
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                const res = await fetch('/api/insights/upload', {
                  method: 'POST',
                  body: uploadFormData,
                });
                const data = await res.json();
                if (data.url) {
                  setFormData(prev => ({ ...prev, teaserImage: data.url }));
                  alert('アップロード完了');
                }
              }
            }}
            style={{ marginTop: '0.5rem' }}
          />
          {formData.teaserImage && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: '#f9f9f9' }}>
              <img 
                src={formData.teaserImage} 
                alt="Teaser Preview" 
                style={{ maxWidth: '200px', display: 'block' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling!.textContent = '画像を読み込めません';
                }}
              />
              <span style={{ fontSize: '0.85rem', color: '#666' }}></span>
            </div>
          )}
        </label>

        <label>
          ストーリー画面画像 (b2) - 最大3枚:
          <div style={{ marginTop: '0.5rem' }}>
            {[0, 1, 2].map((index) => (
              <div key={index} style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fafafa' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>画像 {index + 1}:</label>
                <input
                  type="text"
                  value={formData.storyImages?.[index] || ''}
                  onChange={(e) => {
                    const newImages = [...(formData.storyImages || [])];
                    newImages[index] = e.target.value;
                    setFormData({ ...formData, storyImages: newImages });
                  }}
                  placeholder="URLを入力 または ファイルをアップロード"
                  style={{ width: '100%', marginTop: '0.25rem' }}
                />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const uploadFormData = new FormData();
                      uploadFormData.append('file', file);
                      const res = await fetch('/api/insights/upload', {
                        method: 'POST',
                        body: uploadFormData,
                      });
                      const data = await res.json();
                      if (data.url) {
                        const newImages = [...(formData.storyImages || [])];
                        newImages[index] = data.url;
                        setFormData(prev => ({ ...prev, storyImages: newImages }));
                        alert('アップロード完了');
                      }
                    }
                  }}
                  style={{ marginTop: '0.5rem' }}
                />
                {formData.storyImages?.[index] && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
                    <img 
                      src={formData.storyImages[index]} 
                      alt={`Story ${index + 1} Preview`} 
                      style={{ maxWidth: '150px', display: 'block' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.textContent = '画像を読み込めません';
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#666' }}></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </label>

        <label>
          次回メンテナンス日:
          <input
            type="date"
            value={formData.maintenanceDate}
            onChange={(e) => setFormData({ ...formData, maintenanceDate: e.target.value })}
          />
        </label>

        <label>
          メンテナンス理由:
          <input
            type="text"
            value={formData.maintenanceReason}
            onChange={(e) => setFormData({ ...formData, maintenanceReason: e.target.value })}
            maxLength={50}
          />
        </label>

        <label>
          備考:
          <input
            type="text"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            maxLength={200}
          />
        </label>

        <label>
          更新者:
          <input
            type="text"
            value={formData.updatedBy}
            onChange={(e) => setFormData({ ...formData, updatedBy: e.target.value })}
          />
        </label>

        <div style={{ marginTop: '2rem' }}>
          <button type="submit">{isEdit ? '更新' : '登録'}</button>
          <button type="button" onClick={onBack} style={{ marginLeft: '1rem' }}>キャンセル</button>
        </div>
      </form>
    </div>
  );
};

const ImagePreview: React.FC<{
  teaserImage: string;
  storyImages: string[];
  onClose: () => void;
}> = ({ teaserImage, storyImages, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">✕</button>
        <h2>画像プレビュー</h2>
        
        <div className="image-section">
          <h3>ティーザー画像</h3>
          {teaserImage ? (
            <img src={teaserImage} alt="Teaser" style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }} />
          ) : (
            <p>画像がありません</p>
          )}
        </div>
        
        <div className="image-section">
          <h3>ストーリー画像</h3>
          {storyImages && storyImages.length > 0 ? (
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {storyImages.map((img, idx) => (
                <img key={idx} src={img} alt={`Story ${idx + 1}`} style={{ maxWidth: '400px', maxHeight: '400px', objectFit: 'contain' }} />
              ))}
            </div>
          ) : (
            <p>画像がありません</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
