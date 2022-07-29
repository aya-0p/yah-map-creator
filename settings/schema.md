# デバイス追加
## 方法
1. このディレクトリに(デバイス名).jsonを作成
2. [以下のドキュメント](#documents)を参考に作成
3. 必要ならこのディレクトリに(デバイス名)\_(距離)\_(方向).pngを配置

## documents
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
- type(x, y, topBarBottomX): **number**
- type(dictionary, animationAndKeyboard, start, end): **{"x": number, "y": number}**
- required: **all**
- description: 

### Place
- type: object
- properties: \[[**start(Points)**](#Points), [**end(Points)**](#Points)\]
- required: **all**
- description: 

### Other
- type: array([**Place**](#Place))
- description: 
