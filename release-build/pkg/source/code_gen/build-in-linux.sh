#!/bin/bash

# =============================================================================
# C++ 协议解析代码生成系统 - Linux/Mac 构建脚本
# =============================================================================
# 功能: 在Linux/Mac环境下构建完整的代码生成系统和测试套件
# 用法: ./build-in-linux.sh [选项]
# 选项:
#   --clean         清理构建文件
#   --test-only     仅运行测试，不重新生成代码
#   --no-package    不打包独立可执行文件
#   --help          显示帮助信息
# =============================================================================

set -e  # 遇到错误时立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "${PURPLE}[SECTION]${NC} === $1 ==="
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 显示帮助信息
show_help() {
    echo "C++ 协议解析代码生成系统构建脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --clean        清理所有构建文件"
    echo "  --test-only    仅运行测试，不重新生成代码"
    echo "  --no-package   不打包独立可执行文件"
    echo "  --help         显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整构建 + 打包独立可执行文件到 cli/"
    echo "  $0 --test-only        # 仅运行现有测试"
    echo "  $0 --clean            # 清理构建文件"
    echo "  $0 --no-package       # 只构建测试，不打包CLI"
    echo ""
}

# 清理函数
clean_build() {
    log_section "清理构建文件"

    log_step "清理生成的代码..."
    if [ -d "tests/generated" ]; then
        rm -rf tests/generated
        log_success "已删除 tests/generated 目录"
    fi

    log_step "清理测试运行器构建文件..."
    if [ -d "tests/test_runner/build" ]; then
        rm -rf tests/test_runner/build
        log_success "已删除 tests/test_runner/build 目录"
    fi

    # 清理可能的二进制文件
    if [ -f "tests/test_runner/protocol_tests" ]; then
        rm -f tests/test_runner/protocol_tests
        log_success "已删除测试可执行文件"
    fi

    log_step "清理 node_modules..."
    if [ -d "nodegen/node_modules" ]; then
        rm -rf nodegen/node_modules
        log_success "已删除 node_modules 目录"
    fi

    log_step "清理CLI构建文件..."
    if [ -d "cli-build" ]; then
        rm -rf cli-build
        log_success "已删除 cli-build 目录"
    fi

    if [ -d "cli" ]; then
        rm -rf cli
        log_success "已删除 cli 目录"
    fi

    log_success "清理完成"
}

# 检查系统依赖
check_dependencies() {
    log_section "检查系统依赖"

    # 检查 Node.js 版本 (需要 >= 18.17 或 >= 20)
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | sed 's/v//')
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)

        log_info "Node.js 版本: v$NODE_VERSION"

        if [ "$NODE_MAJOR" -lt 18 ]; then
            log_error "Node.js 版本过低 (v$NODE_VERSION)。需要 v18.17 或 v20.0 及以上版本。"
            exit 1
        elif [ "$NODE_MAJOR" -eq 18 ] && [ "$(echo $NODE_VERSION | cut -d. -f2)" -lt 17 ]; then
            log_error "Node.js 18.x 版本过低 (v$NODE_VERSION)。需要 v18.17 及以上版本。"
            exit 1
        fi
    else
        log_error "未找到 Node.js。请先安装 Node.js v18.17+ 或 v20.0+ 版本。"
        exit 1
    fi

    # 检查 npm
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        log_info "npm 版本: $NPM_VERSION"
    else
        log_error "未找到 npm。请确保 npm 已正确安装。"
        exit 1
    fi

    # 检查 g++
    if command -v g++ >/dev/null 2>&1; then
        GCC_VERSION=$(g++ --version | head -n1)
        log_info "C++ 编译器: $GCC_VERSION"
    else
        log_warning "未找到 g++ 编译器。如果需要编译测试，请安装 g++。"
    fi

    # 检查 cmake (可选)
    if command -v cmake >/dev/null 2>&1; then
        CMAKE_VERSION=$(cmake --version | head -n1 | cut -d' ' -f3)
        log_info "CMake 版本: $CMAKE_VERSION"
    else
        log_warning "未找到 CMake。将使用 g++ 直接编译测试。"
    fi

    log_success "系统依赖检查完成"
}

# 安装 Node.js 依赖
install_node_dependencies() {
    log_section "安装 Node.js 依赖"

    cd nodegen

    log_step "安装 npm 依赖包..."
    if npm install; then
        log_success "Node.js 依赖安装完成"
    else
        log_error "Node.js 依赖安装失败"
        exit 1
    fi

    cd ..
}

# 生成所有测试代码
generate_test_code() {
    log_section "生成测试代码"

    cd nodegen

    # 确保输出目录存在
    OUTPUT_DIR="../tests/generated"
    mkdir -p "$OUTPUT_DIR"

    log_step "生成基础数据类型测试代码..."

    # 无符号整数测试
    if [ -f "../tests/configs/test_unsigned_int.json" ]; then
        log_step "生成无符号整数测试协议..."
        node main.js ../tests/configs/test_unsigned_int.json -o "$OUTPUT_DIR/unsigned_int"
    fi

    # 有符号整数测试
    if [ -f "../tests/configs/test_signed_int.json" ]; then
        log_step "生成有符号整数测试协议..."
        node main.js ../tests/configs/test_signed_int.json -o "$OUTPUT_DIR/signed_int"
    fi

    # 浮点数测试
    if [ -f "../tests/configs/test_float.json" ]; then
        log_step "生成浮点数测试协议..."
        node main.js ../tests/configs/test_float.json -o "$OUTPUT_DIR/float"
    fi

    # BCD 测试
    if [ -f "../tests/configs/test_bcd.json" ]; then
        log_step "生成BCD测试协议..."
        node main.js ../tests/configs/test_bcd.json -o "$OUTPUT_DIR/bcd"
    fi

    # 时间戳测试
    if [ -f "../tests/configs/test_timestamp.json" ]; then
        log_step "生成时间戳测试协议..."
        node main.js ../tests/configs/test_timestamp.json -o "$OUTPUT_DIR/timestamp"
    fi

    # 字符串测试
    if [ -f "../tests/configs/test_string.json" ]; then
        log_step "生成字符串测试协议..."
        node main.js ../tests/configs/test_string.json -o "$OUTPUT_DIR/string"
    fi

    # 位域测试
    if [ -f "../tests/configs/test_bitfield.json" ]; then
        log_step "生成位域测试协议..."
        node main.js ../tests/configs/test_bitfield.json -o "$OUTPUT_DIR/bitfield"
    fi

    # 编码映射测试
    if [ -f "../tests/configs/test_encode.json" ]; then
        log_step "生成编码映射测试协议..."
        node main.js ../tests/configs/test_encode.json -o "$OUTPUT_DIR/encode"
    fi

    # 数组测试
    if [ -f "../tests/configs/test_array.json" ]; then
        log_step "生成数组测试协议..."
        node main.js ../tests/configs/test_array.json -o "$OUTPUT_DIR/array"
    fi

    # 结构体测试
    if [ -f "../tests/configs/test_struct.json" ]; then
        log_step "生成结构体测试协议..."
        node main.js ../tests/configs/test_struct.json -o "$OUTPUT_DIR/struct"
    fi

    # 命令字测试
    if [ -f "../tests/configs/test_command.json" ]; then
        log_step "生成命令字测试协议..."
        node main.js ../tests/configs/test_command.json -o "$OUTPUT_DIR/command"
    fi

    log_step "生成分发器测试代码..."

    # 分发器测试1 (offset=0)
    if [ -f "../tests/configs/dispatcher_test/device_dispatcher.json" ]; then
        log_step "生成分发器测试1 (offset=0)..."
        node main.js ../tests/configs/dispatcher_test/device_dispatcher.json -o "$OUTPUT_DIR/dispatcher"
    fi

    # 分发器测试2 (offset=6)
    if [ -f "../tests/configs/dispatcher_test2/iot_dispatcher.json" ]; then
        log_step "生成分发器测试2 (offset=6)..."
        node main.js ../tests/configs/dispatcher_test2/iot_dispatcher.json -o "$OUTPUT_DIR/dispatcher2"
    fi

    log_step "生成校验和测试代码..."

    # 校验和测试 - 标准累加和
    if [ -f "../tests/configs/test_checksum_1_standard.json" ]; then
        log_step "生成校验和测试协议..."
        node main.js ../tests/configs/test_checksum_1_standard.json -o "$OUTPUT_DIR/checksum_1_standard"
    fi

    # 综合IoT测试
    if [ -f "../tests/configs/test_comprehensive_iot.json" ]; then
        log_step "生成综合IoT测试协议..."
        node main.js ../tests/configs/test_comprehensive_iot.json -o "$OUTPUT_DIR/comprehensive_iot"
    fi

    cd ..

    log_success "测试代码生成完成"
}

# 编译测试程序
build_tests() {
    log_section "编译测试程序"

    cd tests/test_runner

    # 创建构建目录
    mkdir -p build
    cd build

    # 使用 CMake 构建 (如果可用)
    if command -v cmake >/dev/null 2>&1; then
        log_step "使用 CMake 构建测试..."

        # 配置项目
        if cmake .. -DCMAKE_BUILD_TYPE=Release; then
            log_success "CMake 配置完成"
        else
            log_error "CMake 配置失败"
            exit 1
        fi

        # 编译项目
        if make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4); then
            log_success "测试程序编译完成"
        else
            log_error "测试程序编译失败"
            exit 1
        fi
    else
        log_step "使用 g++ 直接编译测试..."

        # 回到上级目录进行直接编译
        cd ..

        # 收集所有生成的源文件
        GENERATED_SOURCES=""
        FRAMEWORK_DIR="../generated/unsigned_int/protocol_parser_framework"

        if [ -d "$FRAMEWORK_DIR" ]; then
            FRAMEWORK_SOURCES="$FRAMEWORK_DIR/*.cpp"
        else
            log_error "未找到框架文件: $FRAMEWORK_DIR"
            exit 1
        fi

        # 收集协议源文件
        for protocol_dir in ../generated/*/; do
            if [ -d "$protocol_dir" ]; then
                for cpp_file in "$protocol_dir"*_parser.cpp "$protocol_dir"*_dispatcher.cpp; do
                    if [ -f "$cpp_file" ]; then
                        GENERATED_SOURCES="$GENERATED_SOURCES $cpp_file"
                    fi
                done
            fi
        done

        # 收集测试源文件
        TEST_SOURCES="main.cpp test_*.cpp"

        # 编译命令
        COMPILE_CMD="g++ -std=c++11 -O2 -Wall -Wextra -I$FRAMEWORK_DIR $TEST_SOURCES $GENERATED_SOURCES -o protocol_tests"

        log_step "编译命令: $COMPILE_CMD"

        if eval $COMPILE_CMD; then
            log_success "测试程序编译完成"
        else
            log_error "测试程序编译失败"
            exit 1
        fi
    fi

    cd ../../..
}

# 运行测试
run_tests() {
    log_section "运行测试"

    cd tests/test_runner

    # 确定可执行文件位置
    if [ -f "build/protocol_tests" ]; then
        TEST_EXECUTABLE="build/protocol_tests"
    elif [ -f "protocol_tests" ]; then
        TEST_EXECUTABLE="protocol_tests"
    else
        log_error "未找到测试可执行文件"
        exit 1
    fi

    log_step "运行测试可执行文件: $TEST_EXECUTABLE"

    if ./"$TEST_EXECUTABLE"; then
        log_success "所有测试通过！"
    else
        log_error "测试失败"
        exit 1
    fi

    cd ../..
}

# 显示构建摘要
show_build_summary() {
    log_section "构建摘要"

    echo "构建制品位置:"
    echo "  代码生成器:   nodegen/main.js"
    echo "  生成代码:     tests/generated/"
    echo "  测试程序:     tests/test_runner/$( [ -f "tests/test_runner/build/protocol_tests" ] && echo "build/" || echo "" )protocol_tests"
    echo "  框架文件:     tests/generated/*/protocol_parser_framework/"
    echo ""

    echo "使用方法:"
    echo "  生成代码:     cd nodegen && node main.js <config.json> -o <output_dir>"
    echo "  运行测试:     tests/test_runner/$( [ -f "tests/test_runner/build/protocol_tests" ] && echo "build/" || echo "" )protocol_tests"
    echo ""

    # 统计生成的文件数量
    if [ -d "tests/generated" ]; then
        HEADER_COUNT=$(find tests/generated -name "*.h" 2>/dev/null | wc -l)
        CPP_COUNT=$(find tests/generated -name "*.cpp" 2>/dev/null | wc -l)
        PROTOCOL_COUNT=$(find tests/generated -maxdepth 2 -type d 2>/dev/null | tail -n +2 | wc -l)

        echo "生成统计:"
        echo "  协议类型数:   $PROTOCOL_COUNT"
        echo "  头文件数量:   $HEADER_COUNT"
        echo "  源文件数量:   $CPP_COUNT"
    fi
}

# 打包独立可执行文件（不依赖 Node.js）
package_standalone() {
    log_section "打包独立可执行文件"

    cd nodegen

    # 确保依赖已安装
    if [ ! -d "node_modules" ]; then
        log_step "安装 Node.js 依赖..."
        npm install
    fi

    # 安装 esbuild 和 pkg
    log_step "安装打包工具..."
    npm install -D esbuild 2>/dev/null
    npm install -g pkg 2>/dev/null

    # 创建构建目录
    mkdir -p ../cli-build

    # 使用 esbuild 打包成 CommonJS
    log_step "使用 esbuild 打包代码..."
    npx esbuild main.js --bundle --platform=node --format=cjs \
        --outfile=../cli-build/bundle.cjs \
        --banner:js="const __importMetaUrl = require('url').pathToFileURL(__filename).href;" \
        --define:import.meta.url=__importMetaUrl

    cd ../cli-build

    # 复制资源文件
    log_step "复制资源文件..."
    cp -r ../templates .
    cp -r ../protocol_parser_framework .

    # 创建 package.json
    cat > package.json << 'PKGJSON'
{
  "name": "protocol-codegen",
  "version": "1.0.0",
  "main": "bundle.cjs",
  "bin": "bundle.cjs",
  "pkg": {
    "assets": ["templates/**/*", "protocol_parser_framework/**/*"]
  }
}
PKGJSON

    # 检测系统架构并打包
    log_step "打包可执行文件..."
    if [[ "$(uname)" == "Darwin" ]]; then
        if [[ "$(uname -m)" == "arm64" ]]; then
            TARGET="node18-macos-arm64"
        else
            TARGET="node18-macos-x64"
        fi
        OUTPUT_NAME="protocol-codegen-macos"
    else
        TARGET="node18-linux-x64"
        OUTPUT_NAME="protocol-codegen-linux"
    fi

    npx pkg . --targets "$TARGET" --output "$OUTPUT_NAME"

    # 创建最终分发目录
    log_step "创建分发包..."
    rm -rf ../cli
    mkdir -p ../cli
    mv "$OUTPUT_NAME" ../cli/
    cp -r templates ../cli/
    cp -r protocol_parser_framework ../cli/

    # 创建启动脚本
    cat > ../cli/codegen << LAUNCHER
#!/bin/bash
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
"\$SCRIPT_DIR/$OUTPUT_NAME" --template-dir "\$SCRIPT_DIR/templates" --framework-src "\$SCRIPT_DIR/protocol_parser_framework" "\$@"
LAUNCHER
    chmod +x ../cli/codegen

    # 清理构建目录
    cd ..
    rm -rf cli-build

    log_success "独立可执行文件打包完成"
}

# 主函数
main() {
    # 解析命令行参数
    CLEAN_ONLY=false
    TEST_ONLY=false
    NO_PACKAGE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                CLEAN_ONLY=true
                shift
                ;;
            --test-only)
                TEST_ONLY=true
                shift
                ;;
            --no-package)
                NO_PACKAGE=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    echo -e "${PURPLE}"
    echo "========================================"
    echo "  C++ 协议解析代码生成系统"
    echo "  Linux/Mac 构建脚本"
    echo "========================================"
    echo -e "${NC}"

    # 仅清理模式
    if [ "$CLEAN_ONLY" = true ]; then
        clean_build
        log_success "清理完成"
        exit 0
    fi

    # 检查系统依赖
    check_dependencies

    # 安装 Node.js 依赖
    install_node_dependencies

    # 生成测试代码 (除非指定仅测试)
    if [ "$TEST_ONLY" != true ]; then
        generate_test_code
        build_tests
    fi

    # 运行测试
    run_tests

    # 显示构建摘要
    show_build_summary

    # 默认打包独立可执行文件
    if [ "$NO_PACKAGE" != true ] && [ "$TEST_ONLY" != true ]; then
        package_standalone

        echo ""
        echo "📦 独立可执行文件已生成到 cli/ 目录"
        echo "使用方法: ./cli/codegen your_config.json -o ./output"
        echo ""
        ls -la cli/
    fi

    log_success "构建完成！🎉"
}

# 脚本入口
main "$@"
