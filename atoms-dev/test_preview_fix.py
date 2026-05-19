#!/usr/bin/env python3
"""
测试预览路由修复
"""

import urllib.request
import urllib.error
import json
import os

def test_sandbox_structure():
    """测试沙箱目录结构"""
    sandbox_dir = "/tmp/atoms-sandbox"
    print("=" * 60)
    print("测试沙箱文件服务")
    print("=" * 60)
    
    # 创建测试沙箱
    test_id = "test-sandbox-123"
    test_dir = os.path.join(sandbox_dir, test_id)
    
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
    
    # 创建测试文件
    test_html = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试页面</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    h1 { color: #667eea; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ 预览路由已修复！</h1>
    <p>恭喜！文件服务现在可以正常工作了！</p>
  </div>
</body>
</html>
"""
    
    with open(os.path.join(test_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(test_html)
    
    print("\n📁 创建测试沙箱:", test_id)
    print("📄 写入测试文件:", "index.html")
    
    # 测试访问
    url = f"http://localhost:3001/{test_id}/index.html"
    print("\n🔗 测试访问:", url)
    
    try:
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req, timeout=5)
        status = response.getcode()
        
        if status == 200:
            print(f"  ✅ 成功: HTTP {status}")
            print("  ✅ 文件已正确提供服务！")
            return True
        else:
            print(f"  ❌ 失败: HTTP {status}")
            return False
            
    except Exception as e:
        print(f"  ❌ 错误: {str(e)}")
        return False

if __name__ == "__main__":
    test_sandbox_structure()
    print("\n" + "=" * 60)
    print("现在可以刷新浏览器重新测试了！")
    print("=" * 60)
