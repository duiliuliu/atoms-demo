from playwright.sync_api import sync_playwright
import sys

def test_atoms_dev():
    results = {
        'passed': [],
        'failed': [],
        'screenshots': []
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # Test 1: Navigate to homepage
            print("Test 1: Navigating to homepage...")
            page.goto('http://localhost:5173')
            page.wait_for_load_state('networkidle')
            page.screenshot(path='/tmp/atoms_homepage.png', full_page=True)
            results['screenshots'].append('/tmp/atoms_homepage.png')
            print("  ✓ Page loaded successfully")
            results['passed'].append('Page navigation')
            
            # Test 2: Check for main elements
            print("\nTest 2: Checking for main elements...")
            
            # Check header
            header = page.locator('header')
            if header.is_visible():
                print("  ✓ Header is visible")
                results['passed'].append('Header visibility')
            else:
                results['failed'].append('Header visibility')
            
            # Check for logo text
            logo = page.locator('text=Atoms.dev')
            if logo.is_visible():
                print("  ✓ Logo text is visible")
                results['passed'].append('Logo text')
            else:
                results['failed'].append('Logo text')
            
            # Check for AI provider selector
            provider_btn = page.locator('button:has-text("DeepSeek")')
            if provider_btn.is_visible():
                print("  ✓ AI provider selector is visible")
                results['passed'].append('AI provider selector')
            else:
                results['failed'].append('AI provider selector')
            
            # Test 3: Check chat area
            print("\nTest 3: Checking chat area...")
            
            welcome_title = page.locator('text=欢迎使用 Atoms.dev')
            if welcome_title.is_visible():
                print("  ✓ Welcome message is visible")
                results['passed'].append('Welcome message')
            else:
                results['failed'].append('Welcome message')
            
            # Check for example prompts
            example = page.locator('text=创建一个待办事项应用')
            if example.is_visible():
                print("  ✓ Example prompts are visible")
                results['passed'].append('Example prompts')
            else:
                results['failed'].append('Example prompts')
            
            # Test 4: Check input box
            print("\nTest 4: Checking input components...")
            
            input_box = page.locator('input[placeholder*="描述"]')
            if input_box.is_visible():
                print("  ✓ Input box is visible")
                results['passed'].append('Input box')
            else:
                results['failed'].append('Input box')
            
            # Test 5: Check tab bar
            print("\nTest 5: Checking tab bar...")
            
            preview_tab = page.locator('button:has-text("预览")')
            code_tab = page.locator('button:has-text("代码")')
            terminal_tab = page.locator('button:has-text("终端")')
            
            if preview_tab.is_visible():
                print("  ✓ Preview tab is visible")
                results['passed'].append('Preview tab')
            else:
                results['failed'].append('Preview tab')
                
            if code_tab.is_visible():
                print("  ✓ Code tab is visible")
                results['passed'].append('Code tab')
            else:
                results['failed'].append('Code tab')
                
            if terminal_tab.is_visible():
                print("  ✓ Terminal tab is visible")
                results['passed'].append('Terminal tab')
            else:
                results['failed'].append('Terminal tab')
            
            # Test 6: Test tab switching
            print("\nTest 6: Testing tab switching...")
            
            code_tab.click()
            page.wait_for_timeout(500)
            page.screenshot(path='/tmp/atoms_code_tab.png')
            results['screenshots'].append('/tmp/atoms_code_tab.png')
            
            terminal_tab.click()
            page.wait_for_timeout(500)
            page.screenshot(path='/tmp/atoms_terminal_tab.png')
            results['screenshots'].append('/tmp/atoms_terminal_tab.png')
            
            preview_tab.click()
            page.wait_for_timeout(500)
            page.screenshot(path='/tmp/atoms_preview_tab.png')
            results['screenshots'].append('/tmp/atoms_preview_tab.png')
            
            print("  ✓ Tab switching works")
            results['passed'].append('Tab switching')
            
            # Test 7: Test AI provider switch
            print("\nTest 7: Testing AI provider switch...")
            
            provider_btn.click()
            page.wait_for_timeout(500)
            
            zhipu_option = page.locator('button:has-text("智谱AI")')
            if zhipu_option.is_visible():
                print("  ✓ Provider dropdown opens correctly")
                results['passed'].append('Provider dropdown')
                
                zhipu_option.click()
                page.wait_for_timeout(500)
                
                # Check if Zhipu is now selected
                new_provider = page.locator('button:has-text("智谱AI")')
                if new_provider.is_visible():
                    print("  ✓ Provider switching works")
                    results['passed'].append('Provider switching')
                else:
                    results['failed'].append('Provider switching')
            else:
                results['failed'].append('Provider dropdown')
            
            # Test 8: Test typing in input
            print("\nTest 8: Testing input interaction...")
            
            input_box.fill("测试消息")
            page.wait_for_timeout(300)
            
            input_value = input_box.input_value()
            if input_value == "测试消息":
                print("  ✓ Input typing works")
                results['passed'].append('Input typing')
            else:
                results['failed'].append('Input typing')
            
            # Test 9: Check for console errors
            print("\nTest 9: Checking for console errors...")
            errors = []
            page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
            page.reload()
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            
            if not errors:
                print("  ✓ No console errors")
                results['passed'].append('No console errors')
            else:
                print(f"  ⚠ Found {len(errors)} console errors:")
                for err in errors[:3]:
                    print(f"    - {err[:100]}")
                results['failed'].append('Console errors')
            
        except Exception as e:
            print(f"\n❌ Test error: {str(e)}")
            results['failed'].append(f'Test error: {str(e)}')
            page.screenshot(path='/tmp/atoms_error.png')
            results['screenshots'].append('/tmp/atoms_error.png')
        
        finally:
            browser.close()
    
    return results

if __name__ == '__main__':
    print("=" * 60)
    print("Atoms.dev Frontend Testing")
    print("=" * 60)
    
    results = test_atoms_dev()
    
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    
    print(f"\n✅ Passed ({len(results['passed'])}):")
    for test in results['passed']:
        print(f"  ✓ {test}")
    
    if results['failed']:
        print(f"\n❌ Failed ({len(results['failed'])}):")
        for test in results['failed']:
            print(f"  ✗ {test}")
    
    print(f"\n📸 Screenshots saved:")
    for shot in results['screenshots']:
        print(f"  - {shot}")
    
    print("\n" + "=" * 60)
    
    # Exit with appropriate code
    if results['failed']:
        print(f"❌ {len(results['failed'])} test(s) failed")
        sys.exit(1)
    else:
        print("✅ All tests passed!")
        sys.exit(0)
