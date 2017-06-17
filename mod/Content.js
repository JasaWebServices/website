return {
	signals:['pageAdded'],
	slots:{
		pageAdd:function(from,sender,paneId){
			this.signals.pageAdded(paneId).send(sender)
		}
	}
}
