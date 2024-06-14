
原理就是搭建一套tcp的Bytes解析服务器, 抓包获取Proto文件, 小程序的流量由Fiddler管理, FiddlerScript把劫持到的流量转发给自己的Bytes解析服务.

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