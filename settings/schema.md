# デバイス追加
## 方法
1. このディレクトリに(デバイス名).jsonを作成
2. [以下のドキュメント](#ドキュメント)を参考に作成
3. 必要ならこのディレクトリに(デバイス名)\_(距離)\_(方向).pngを配置
## How to add device settings
1. Make '(device name).json'
2. Write down by [documents](#Documents).
3. Set (device name)\_(distance)\_(direction).png if need.
## Documents
## ドキュメント
### (root)
- type: **object**
- properties: \[[**Near(距離)**](#距離), [**Medium(距離)**](#距離), [**Far(距離)**](#距離)\]
- 説明: 距離の設定。少なくとも1つ必要。

### 距離
- type: **object**
- properties: \[[**0(方向)**](#方向), [**1(方向)**](#方向)\]
- 説明: スマホの方向。0で縦、1で横。少なくとも1つ必要。

### 方向
- type: **object**
- properties: \[[**x(場所)**](#場所), [**y(場所)**](#場所), [**block(ブロック)**](#ブロック), [**image(画像)**](#画像), [**topBarBottomX(場所)**](#場所), [**dictionary(場所)**](#場所), [**animationAndKeyboard(場所)**](#場所), [**player(空間)**](#空間), [**other(他)**](#他)\]
- required(if image is true): \[**x**, **y**, **block**, **image**\]
- required(if image is false): **all**
- description: The places where is annouing to make map image.

### Points
- type(x, y, topBarBottomX): **integer(>0)**
- type(dictionary, animationAndKeyboard, start, end): **{"x": integer(>0), "y": integer(>0)}**
- required: **all**
- description: 

### Place
- type: object
- properties: \[[**start(Points)**](#Points), [**end(Points)**](#Points)\]
- required: **all**
- description: See [Points](#Points)

### Other
- type: **array([Place](#Place))**
- description: Smartphone notch, menu bar, etc...

### Block
- type: **integer(>0)**
- description: See [Points](#Points)

### Image
- type: **boolean**
- description: Whether clip image was made.
### (root)
- type: **object**
- properties: \[[**Near(Distance)**](#Distance), [**Medium(Distance)**](#Distance), [**Far(Distance)**](#Distance)\]
- description: This is distance settings. Required at least 1 property.

### Distance
- type: **object**
- properties: \[[**0(Direction)**](#Direction), [**1(Direction)**](#Direction)\]
- description: This is the direction of phone. 0 is vertical and 1 is horizontal. Required at least 1 property.

### Direction
- type: **object**
- properties: \[[**x(Points)**](#Points), [**y(Points)**](#Points), [**block**](#Block), [**image**](#Image), [**topBarBottomX(Points)**](#Points), [**dictionary(Points)**](#Points), [**animationAndKeyboard(Points)**](#Points), [**player**](#Place), [**other**](#Other)\]
- required(if image is true): \[**x**, **y**, **block**, **image**\]
- required(if image is false): **all**
- description: The places where is annouing to make map image.

### Points
- type(x, y, topBarBottomX): **integer(>0)**
- type(dictionary, animationAndKeyboard, start, end): **{"x": integer(>0), "y": integer(>0)}**
- required: **all**
- description: 

### Place
- type: object
- properties: \[[**start(Points)**](#Points), [**end(Points)**](#Points)\]
- required: **all**
- description: See [Points](#Points)

### Other
- type: **array([Place](#Place))**
- description: Smartphone notch, menu bar, etc...

### Block
- type: **integer(>0)**
- description: See [Points](#Points)

### Image
- type: **boolean**
- description: Whether clip image was made.
