#!/usr/bin/env python3
"""
测试新的沙箱目录结构
"""

import urllib.request
import urllib.error
import json
import os
import sys

def test_new_sandbox_structure():
    print("=" * 60)
    print("测试新的沙箱目录结构")
    print("=" * 60)
    
    # 检查沙箱目录是否已创建
    sandbox_dir = os.path.join(os.getcwd(), 'atoms-sandbox')
    print(f"\n📁 预期沙箱目录: {sandbox_dir}")
    
    # 测试访问健康检查
    url = "http://localhost:3001/health"
    try:
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req, timeout=5)
        status = response.getcode()
        
        if status == 200:
            print(f"\n✅ 后端服务健康: HTTP {status}")
        else:
            print(f"\n❌ 后端服务异常: HTTP {status}")
            return False
    except Exception as e:
        print(f"\n❌ 后端服务无法访问: {str(e)}")
        return False
    
    # 检查目录是否已创建
    if os.path.exists(sandbox_dir):
        print(f"✅ 沙箱目录已创建: {sandbox_dir}")
    else:
        print(f"⚠️  沙箱目录不存在，会在首次创建沙箱时自动创建")
    
    # 创建一个测试沙箱文件来验证
    test_dir = os.path.join(sandbox_dir, 'test-sandbox-new')
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
    
    test_html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>New Directory Test</title>
  <style>
    body {
      font-family: system-ui;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      color: white;
    }
    .card {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ 目录结构已更新！</h1>
    <p>沙箱目录现在在 /workspace/atoms-dev/server/atoms-sandbox/</p>
    <p>支持生产环境打包！</p>
  </div>
</body>
</html>"""
    
    with open(os.path.join(test_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(test_html)
    
    print(f"\n✅ 创建测试文件: {test_dir}/index.html")
    
    # 测试访问新的沙箱文件
    test_url = "http://localhost:3001/test-sandbox-new/index.html"
    print(f"\n🔗 测试访问: {test_url}")
    
    try:
        req = urllib.request.Request(test_url)
        response = urllib.request.urlopen(req, timeout=5)
        status = response.getcode()
        
        if status == 200:
            print(f"✅ 文件服务正常: HTTP {status}")
            print("\n" + "=" * 60)
            print("🎉 新的目录结构已成功配置！")
            print("=" * 60)
            print(f"\n沙箱目录: {sandbox_dir}")
            print("\n现在可以刷新浏览器测试完整功能了！")
            return True
        else:
            print(f"❌ 文件服务异常: HTTP {status}")
            return False
            
    except Exception as e:
        print(f"❌ 文件无法访问: {str(e)}")
        return False

if __name__ == "__main__":
    # 切换到 server 目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    test_new_sandbox_structure()
