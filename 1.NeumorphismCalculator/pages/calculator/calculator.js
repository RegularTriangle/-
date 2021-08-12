// pages/calculator/calculator.js

import {
    evaluate,
    Function
  } from '../../eval5/eval5.js'
  
  // 获取应用实例
  const app = getApp()
  
  Page({
    data: {
      skinStyle: 'light',
      navH: 0,
      styleSwitchImageUrl: "../../static/light.png",
      // 计算历史
      historyList: [],
      // 当前算式
      equation: '0',
      // 小数标记
      isDecimalAdded: false,
      // 是否按下+ - × ÷
      isOperatorAdded: false,
      // 是否刚刚启动
      isStarted: false,
      // 当前算式结果
      currentResult: '0',
      // 当前显示算式
      currentFormula: '',
      // 历史条目
      historyCount: 0,
      // 是否按下=
      isEqualAdded: false,
      // 用于控制历史条码自动滚动到底部
      scrollToLast: `history${0}`
    },
  
  
    // 切换夜间模式
    changeStyle() {
      wx.showToast({
        title: this.data.skinStyle === 'light' ? '深色模式' : '浅色模式',
        duration: 500,
        image: this.data.skinStyle === 'light' ? "../../static/dark_large.png" : "../../static/light_large.png"
      });
      this.setData({
        skinStyle: this.data.skinStyle === 'light' ? 'dark' : 'light',
        styleSwitchImageUrl: this.data.styleSwitchImageUrl === "../../static/light.png" ? "../../static/dark.png" : "../../static/light.png",
      });
      // 修改顶部导航栏样式
      wx.setNavigationBarColor({
        frontColor: this.data.skinStyle === 'light' ? '#000000' : '#ffffff',
        backgroundColor: this.data.skinStyle === 'light' ? '#EEEEEE' : '#1F252A',
        animation: {
          duration: 100,
          timingFunc: 'easeInOut'
        }
      });
    },
    
    // 判定是否是+, -, ×, ÷
    isOperator(character) {
      return ['+', '-', '×', '÷'].indexOf(character) > -1
    },
    // 按下+ - × ÷ 或 0-9或.
    append(res) {
  
      var character = res.target.id;
      var formula = this.data.equation;
  
      // console.log("按下" + character)
  
      // 初始状态按下小数点
      if (formula === '0' && !this.isOperator(character)) {
        // 按下小数点
        if (character === '.') {
          formula += '' + character
          this.data.isDecimalAdded = true
        } else {
          formula = '' + character
        }
  
        this.data.isStarted = true
  
        this.data.equation = formula
        // 显示当前计算式子
        this.setData({
          currentFormula: formula
        });
        return
      }
  
      // 按下数字
      if (!this.isOperator(character)) {
        if (character === '.' && this.data.isDecimalAdded) {
          return
        }
        // 不在上一次结果上继续计算
        if (this.data.isEqualAdded) {
          formula = ''
          this.data.isEqualAdded = false
          // 记录历史
          // 当前算式不记入历史
          if (this.data.historyCount > 0) {
            var tempHis = this.data.historyList
            tempHis.push(this.data.currentFormula)
            this.setData({
              historyList: tempHis,
              scrollToLast: `history${tempHis.length - 1}`
            });
          }
        }
  
        if (character === '.') {
          this.data.isDecimalAdded = true
          this.data.isOperatorAdded = true
          // 直接按小数点时在小数点前加0
          if (this.isOperator(formula[formula.length - 1]) || formula === '') {
            formula += '0'
          }
        } else {
          this.data.isOperatorAdded = false
        }
        formula += '' + character
  
        this.data.equation = formula
        // 显示当前计算式子
        this.setData({
          currentFormula: formula
        });
      }
  
      // 按下+ - × ÷运算符
      if (this.isOperator(character)) {
        // 运算符替换
        if (this.data.isOperatorAdded) {
          formula = formula.substr(0, formula.length - 1)
        }
  
        // 在上一次结果上继续运算
        if (this.data.isEqualAdded) {
          formula = ''
          formula += this.data.currentResult
          this.data.isEqualAdded = false
          // 记录历史
          // 当前算式不记入历史
          if (this.data.historyCount > 0) {
            var tempHis = this.data.historyList
            tempHis.push(this.data.currentFormula)
            this.setData({
              historyList: tempHis,
              scrollToLast: `history${tempHis.length - 1}`
            });
          }
        }
  
        formula += '' + character
        this.data.isDecimalAdded = false
        this.data.isOperatorAdded = true
  
        this.data.equation = formula
        // 显示当前计算式子
        this.setData({
          currentFormula: formula
        });
      }
    },
  
    // 按下=
    calculate() {
      // 在上一次结果上继续运算
      if (this.data.isEqualAdded) {
        formula = ''
        formula += this.data.currentResult
        this.data.isEqualAdded = false
        // 记录历史
        // 当前算式不记入历史
        if (this.data.historyCount > 0) {
          var tempHis = this.data.historyList
          tempHis.push(this.data.currentFormula)
          this.setData({
            historyList: tempHis,
            scrollToLast: `history${tempHis.length - 1}`
          });
        }
      }
  
      var formula = this.data.equation;
  
      // 单出现 6- 这种情况时, 后面补零, 避免报错
      if (this.isOperator(formula[formula.length - 1])) {
        formula += '0'
      }
  
      // 替换所有×为*, 所有÷为/, 用于evaluate函数
      var temp = formula.replace(new RegExp('×', 'g'), '*').replace(new RegExp('÷', 'g'), '/')
      // 计算式子结果 
      var result = evaluate(temp)
  
      /** ------------------- 下面的处理方式不优雅, 连续使用%可能出现bug ---------------------- */
      // 处理数位避免超出显示器
      // 显示器最多数位
      var maxShowLen = 8
      if (Math.abs(result) > Math.pow(10, maxShowLen)) {
        result = result.toExponential()
      }
      result = result.toString()
  
      var eIndex = result.indexOf('e') // 判断是否采用科学计数法, 没有'e'返回-1, 表示没有科学计数法
      var dotIndex = result.indexOf('.')
  
      // 结果类似于1.1111111111e+33
      if (eIndex != -1 && dotIndex != -1) {
        var temp1 = result.substr(0, dotIndex) //.前
        var temp3 = result.substr(eIndex, result.length - 1) //e后
  
        // 最多显示10个数字最好
        var tempLen1 = maxShowLen - temp1.length - temp3.length //显示器剩余字节数
        var tempLen2 = eIndex - dotIndex // 实际.到e之间的所有字节数
        var temp2 = result.substr(dotIndex, tempLen1 < tempLen2 ? tempLen1 : tempLen2)
        result = temp1 + temp2 + temp3
      }
      // 结果类似于3.333333333333333
      else if (eIndex == -1 && dotIndex != -1) {
        if (result.indexOf('-') == -1) {
          maxShowLen += 1
        }
        result = result.substr(0, maxShowLen)
      }
      /** ------------------- 上面的处理方式不优雅, 连续使用%可能出现bug ---------------------- */
  
      this.data.isDecimalAdded = false
      this.data.isOperatorAdded = false
      this.data.isEqualAdded = true
  
      // 记录历史
      this.data.historyCount++
  
      this.setData({
        currentResult: result,
        currentFormula: formula + '=' + result
      });
    },
  
    // 按下正负号
    calculateToggle() {
      var formula = this.data.equation;
  
      if (this.data.isOperatorAdded || !this.data.isStarted) {
        return
      }
  
      // 在上一次结果上继续运算
      if (this.data.isEqualAdded) {
        formula = ''
        formula += this.data.currentResult
        this.data.isEqualAdded = false
        // 记录历史
        // 当前算式不记入历史
        if (this.data.historyCount > 0) {
          var tempHis = this.data.historyList
          tempHis.push(this.data.currentFormula)
          this.setData({
            historyList: tempHis,
            scrollToLast: `history${tempHis.length - 1}`
          });
        }
      }
  
      formula = formula + '×(-1)'
      this.data.equation = formula
      this.setData({
        currentFormula: formula
      });
      this.calculate()
    },
  
    // 按下 %
    calculatePercentage() {
      console.log("按下%")
  
      var formula = this.data.equation;
      if (this.data.isOperatorAdded || !this.data.isStarted) {
        return
      }
  
      // 在上一次结果上继续运算
      if (this.data.isEqualAdded) {
        formula = ''
        formula += this.data.currentResult
        this.data.isEqualAdded = false
        // 记录历史
        // 当前算式不记入历史
        if (this.data.historyCount > 0) {
          var tempHis = this.data.historyList
          tempHis.push(this.data.currentFormula)
          this.setData({
            historyList: tempHis,
            scrollToLast: `history${tempHis.length - 1}`
          });
        }
      }
  
      formula = formula + '×0.01'
      this.data.equation = formula
      this.setData({
        currentFormula: formula
      });
      this.calculate()
    },
  
    // 按下AC键
    clear() {
      this.setData({
        currentResult: '0',
        equation: '0',
        historyList: [],
        historyCount: 0,
        currentFormula: '',
        isDecimalAdded: false,
        isOperatorAdded: false,
        isStarted: false,
        isEqualAdded: false
      });
    }
  })
  
