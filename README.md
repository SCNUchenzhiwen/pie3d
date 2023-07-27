# 3d-pie

## 开始
> 拉取项目安装依赖
```bash
npm run build
```

## 使用
```js
import Pie3d from './Pie3d/Pie3d'

const data = [
  {
    value: 10,
    label: 'label1',
    explore: false
  },
  {
    value: 13,
    color: '#e4353c',
    explore: false,
    label: 'label2'
  },
  {
    value: 20,
    explore: true,
    label: 'label3'
  },
  {
    value: 0,
    explore: true,
    label: 'label4'
  },
  {
    value: 1,
    explore: false,
    label: 'label5'
  },
  {
    value: 4,
    explore: false,
    label: 'label6'
  },
  {
    value: 4,
    explore: false,
    label: 'label7'
  },
  {
    value: 4,
    label: 'label8',
    explore: false
  },
  {
    value: 4,
    label: 'label9',
    explore: false
  }
]
const container = pieContainer
const options = { container }
const pie3d = new Pie3d(options)
const pie3d.updateData(data)
```

## 截图
![](assets/images/pie_1.png)
![](assets/images/pie_2.png)
![](assets/images/pie_3.png)

## TODO
- [x] 数值为0最小角度、最小高度
- [x] 优化百分比计算，根据精度最大小数排序考虑连续相同数据情况，尽可能是相同的数据相同比例
- [x] label视角跟随
- [x] label根据到观察平面距离动态修改透明度，避免多数据大面积重叠
- [x] 根据数据大小展示不同的深度depth
- [ ] 优化渲染，无更新时减少不必要渲染
- [ ] visual map
- [ ] 颜色优化

## 参考

* [react pie3d](https://github.com/pbeshai/3dpie)

<!-- ## License -->

<!-- [MIT](LICENSE). -->
