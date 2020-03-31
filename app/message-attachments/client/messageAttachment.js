import { Template } from 'meteor/templating';

import { DateFormat } from '../../lib';
import { getURL } from '../../utils/client';
import { renderMessageBody } from '../../ui-utils';

const colors = {
	good: '#35AC19',
	warning: '#FCB316',
	danger: '#D30230',
};

openLink = function (link) {
	link = `http://${window.location.hostname}${link}`;
	const ac = document.createElement('a');
	ac.id = 'olink';
	document.body.appendChild(ac);
	const a = document.getElementById('olink');
	a.href = link;
	a.target = '_blank';
	a.click();
};


Template.messageAttachment.helpers({
	parsedText() {
		return renderMessageBody({
			msg: this.text,
		});
	},
	markdownInPretext() {
		return this.mrkdwn_in && this.mrkdwn_in.includes('pretext');
	},
	parsedPretext() {
		return renderMessageBody({
			msg: this.pretext,
		});
	},
	loadImage() {
		if (this.downloadImages) {
			return true;
		}

		if (this.settings.autoImageLoad === false) {
			return false;
		}

		if (this.settings.saveMobileBandwidth === true) {
			return false;
		}

		return true;
	},
	getImageHeight(height = 200) {
		return height;
	},
	color() {
		return colors[this.color] || this.color;
	},
	collapsed() {
		return this.collapsedMedia;
	},
	time() {
		const messageDate = new Date(this.ts);
		const today = new Date();
		if (messageDate.toDateString() === today.toDateString()) {
			return DateFormat.formatTime(this.ts);
		}
		return DateFormat.formatDateAndTime(this.ts);
	},
	injectIndex(data, previousIndex, index) {
		data.index = `${previousIndex}.attachments.${index}`;
	},
	injectSettings(data, settings) {
		data.settings = settings;
	},
	injectMessage(data, { rid, _id }) {
		data.msg = { _id, rid };
	},
	injectCollapsedMedia(data) {
		const { collapsedMedia } = data;
		Object.assign(this, { collapsedMedia });
		return this;
	},
	isFile() {
		return this.type === 'file';
	},
	isPDF() {
		if (
			this.type === 'file'
			&& this.title_link.endsWith('.pdf')
			&& Template.parentData(2).msg.file
		) {
			this.fileId = Template.parentData(2).msg.file._id;
			return true;
		}
		return false;
	},
	// TODO Maxicon
	isFileMaxicon() {
		if (
			this.type === 'file'
			&& (this.title_link.endsWith('.xml') || this.title_link.endsWith('.txt')
				|| this.title_link.endsWith('.jpg') || this.title_link.endsWith('.png')|| this.title_link.endsWith('.log')
				|| this.title_link.endsWith('.json'))
			&& !this.title_link.endsWith('.pdf')
			&& Template.parentData(2).msg.file
		) {
			this.fileId = Template.parentData(2).msg.file._id;
			return true;
		}
		return false;
	},
	// TODO Maxicon
	openLink(link) {
		link = `http://${window.location.hostname}${link}`;
		const ac = document.createElement('a');
		ac.id = 'olink';
		document.body.appendChild(ac);
		const a = document.getElementById('olink');
		a.href = link;
		a.target = '_blank';
		a.click();
	},
	getURL,
});
