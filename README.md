
原理就是搭建一套tcp的Bytes解析服务器, 抓包获取Proto文件, 小程序的流量由Fiddler管理, FiddlerScript把劫持到的流量转发给自己的Bytes解析服务.

```
static function OnWebSocketMessage(oMsg: WebSocketMessage) {
    var direction = oMsg.IsOutbound ? "Client" : "Server";
    // FiddlerApplication.Log.LogString(direction + "消息: " + oMsg.PayloadAsString());

    try {
        var client = new System.Net.Sockets.TcpClient("localhost", 1234);
        var stream = client.GetStream();
        var message = direction + ": " + oMsg.PayloadAsString(); // 添加方向前缀
        var bytesToSend = System.Text.Encoding.UTF8.GetBytes(message);
        stream.Write(bytesToSend, 0, bytesToSend.length);
        stream.Close();
        client.Close();
    } catch (e) {
        FiddlerApplication.Log.LogString("转发错误: " + e.toString());
    }
}
```

[Bilibili](https://www.bilibili.com/opus/942785956421828629) 

## 免责声明
	
本仓库仅供技术学习交流使用，如有下载相关文件，请在学习后24小时内删除相关内容。

切勿在 tb/pdd 等商城的非法渠道付费此软件。

如将本仓库教程/文件用于获利，那么：你妈死了。

请勿将本项目内容用于非法用途，使用者在使用时即视为对行为可能产生的任何不良后果负责。
	
由于传播、利用此工具所提供的信息而造成的任何直接或者间接的后果及损失，均由使用者本人负责，作者不为此承担任何责任。
