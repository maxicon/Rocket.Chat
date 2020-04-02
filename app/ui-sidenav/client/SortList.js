import React, { useCallback } from 'react';
import { Icon, ToggleSwitch, RadioButton, Box, Flex, Margins } from '@rocket.chat/fuselage';


import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useUserPreference } from '../../../client/contexts/UserContext';
import { useMethod } from '../../../client/contexts/ServerContext';
import {  modal } from '../../ui-utils';


function SortListItem({ text, icon, input }) {
	return <Flex.Container>
		<Box is='li'>
			<Flex.Container>
				<Box is='label' componentClassName='rc-popover__label' style={{ width: '100%' }}>
					<Flex.Item grow={0}>
						<Box componentClassName='rc-popover__icon'><Icon name={icon} size={20} /></Box>
					</Flex.Item>
					<Margins inline='x8'>
						<Flex.Item grow={1}>
							<Box is='span' textStyle='p2'>{text}</Box>
						</Flex.Item>
					</Margins>
					<Flex.Item grow={0}>
						{input}
					</Flex.Item>
				</Box>
			</Flex.Container>
		</Box>
	</Flex.Container>;
}
const style = {
	textTransform: 'uppercase',
};
export function SortList() {
	return <>
		<div className='rc-popover__column'>
			<SortModeList />
			<ViewModeList />
			<GroupingList />
			<MaxiconList />
			<MaxiconHideList />
		</div>
	</>;
}

SortList.displayName = 'SortList';

function SortModeList() {
	const t = useTranslation();
	const saveUserPreferences = useMethod('saveUserPreferences');
	const sidebarSortBy = useUserPreference('sidebarSortby', 'alphabetical');

	const handleChange = (value) => () => saveUserPreferences({ sidebarSortby: value });

	const setToAlphabetical = useCallback(handleChange('alphabetical'), []);
	const setToActivity = useCallback(handleChange('activity'), []);

	return <>
		<Margins block='x8'>
			<Box is='p' style={style} textStyle='micro'>{t('Sort_By')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				<SortListItem icon={'sort'} text={t('Alphabetical')} input={<RadioButton name='sidebarSortby' onChange={setToAlphabetical} checked={sidebarSortBy === 'alphabetical'} />} />
				<SortListItem icon={'clock'} text={t('Activity')} input={<RadioButton name='sidebarSortby' onChange={setToActivity} checked={sidebarSortBy === 'activity'} />} />
			</Margins>
		</ul>
	</>;
}


function ViewModeList() {
	const t = useTranslation();

	const saveUserPreferences = useMethod('saveUserPreferences');

	const handleChange = (value) => () => saveUserPreferences({ sidebarViewMode: value });

	const sidebarViewMode = useUserPreference('sidebarViewMode', 'extended');
	const sidebarHideAvatar = useUserPreference('sidebarHideAvatar', false);

	const setToExtended = useCallback(handleChange('extended'), []);
	const setToMedium = useCallback(handleChange('medium'), []);
	const setToCondensed = useCallback(handleChange('condensed'), []);

	const handleChangeSidebarHideAvatar = useCallback(() => saveUserPreferences({ sidebarHideAvatar: !sidebarHideAvatar }), [sidebarHideAvatar]);

	return <>
		<Margins block='x8'>
			<Box is='p' style={style} textStyle='micro'>{t('View_mode')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				<SortListItem icon={'th-list'} text={t('Extended')} input={<RadioButton onChange={setToExtended} name='sidebarViewMode' value='extended' checked={sidebarViewMode === 'extended'} />} />
				<SortListItem icon={'list'} text={t('Medium')} input={<RadioButton onChange={setToMedium} name='sidebarViewMode' value='medium' checked={sidebarViewMode === 'medium'} />} />
				<SortListItem icon={'list-alt'} text={t('Condensed')} input={<RadioButton onChange={setToCondensed} name='sidebarViewMode' value='condensed' checked={sidebarViewMode === 'condensed'} />} />
				<SortListItem icon={'user-rounded'} text={t('Hide_Avatars')} input={<ToggleSwitch onChange={handleChangeSidebarHideAvatar} name='sidebarHideAvatar' checked={sidebarHideAvatar} />} />
			</Margins>
		</ul>
	</>;
}
//TODO Maxicon
function MaxiconList() {
	const saveUserPreferences = useMethod('saveUserPreferences');
	const sidebarFindOnline = useUserPreference('sidebarFindOnline');
	const handleChangeFindOnline = useCallback(() => saveUserPreferences({ sidebarFindOnline: !sidebarFindOnline }), [sidebarFindOnline]);
	return <>
		<Margins block='x8'>
			<Box is='p' style={style} textStyle='micro'></Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				<SortListItem icon={'hashtag'} text={'Pesquisar somente usuários online'} input={<ToggleSwitch onChange={handleChangeFindOnline} name='sidebarFindOnline' checked={sidebarFindOnline} />} />

			</Margins>
		</ul>
	</>;
}
//TODO Maxicon
function MaxiconHideList() {
	const sidebarFindOnline = useUserPreference('sidebarFindOnline');
	const handleChangeFindOnline = useCallback(() => saveUserPreferences({ sidebarFindOnline: !sidebarFindOnline }), [sidebarFindOnline]);
	const hideOneDay = () => {
		modal.open({
			title: t('Are_you_sure'),
			text: t('Hide_One_Day_Room'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false,
		}, async function() {
			const data = new Date();
			data.setHours(0, 0, 0);
			const chats = ChatSubscription.find({ open: true, ls: { $lt: data } }, {}).fetch();
			const rids = [];
			for (let i = 0; i < chats.length; i++) {
				rids.push(chats[i].rid);
			}
			console.log('rids', rids);
			await call('hideRooms', rids);
			for (let r = 0; r < rids.length; r++) {
				if (rids[r] === Session.get('openedRoom')) {
					Session.delete('openedRoom');
				}
			}
		});
		return;
	}
	return <>
		<Margins block='x8'>
			<Box is='p' style={style} textStyle='micro'></Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				<SortListItem icon={'trash'} text={'Esconder salas 1 dia'} input={<ToggleSwitch onChange={hideOneDay} name='sidebarFindOnline' checked={sidebarFindOnline} />} />
				<SortListItem icon={'trash'} text={'Esconder todas as Salas'} input={<ToggleSwitch onChange={handleChangeFindOnline} name='sidebarFindOnline' checked={sidebarFindOnline} />} />

			</Margins>
		</ul>
	</>;
}


function GroupingList() {
	const sidebarShowDiscussion = useUserPreference('sidebarShowDiscussion');
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');
	//TODO Maxicon
	const sidebarGroupByRole = useUserPreference('sidebarGroupByRole', false);
	const saveUserPreferences = useMethod('saveUserPreferences');

	const handleChange = (key, value) => () => saveUserPreferences({ [key]: value });

	const handleChangeShowDicussion = useCallback(handleChange('sidebarShowDiscussion', !sidebarShowDiscussion), [sidebarShowDiscussion]);
	const handleChangeGroupByType = useCallback(handleChange('sidebarGroupByType', !sidebarGroupByType), [sidebarGroupByType]);
	const handleChangeShoFavorite = useCallback(handleChange('sidebarShowFavorites', !sidebarShowFavorites), [sidebarShowFavorites]);
	const handleChangeShowUnread = useCallback(handleChange('sidebarShowUnread', !sidebarShowUnread), [sidebarShowUnread]);
	//TODO Maxicon
	const handleChangeGroupByRole = useCallback(() => {
		if(!sidebarGroupByRole){
			saveUserPreferences({ sidebarGroupByType: false });
			saveUserPreferences({ sidebarShowFavorites: false });
			saveUserPreferences({ sidebarShowUnread: false });
			saveUserPreferences({ sidebarShowDiscussion: false });
		}
		saveUserPreferences({ sidebarGroupByRole: !sidebarGroupByRole });
	});


	const t = useTranslation();
	return <>
		<Margins block='x8'>
			<Box is='p' style={style} textStyle='micro'>{t('Grouping')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				<SortListItem icon={'cube'} text={t('Group_by_Role')} input={<ToggleSwitch onChange={handleChangeGroupByRole} name='sidebarGroupByRole' checked={sidebarGroupByRole} />} />
				<SortListItem icon={'discussion'} text={t('Group_discussions')} input={<ToggleSwitch onChange={handleChangeShowDicussion} name='sidebarShowDiscussion' checked={sidebarShowDiscussion} />} />
				<SortListItem icon={'sort-amount-down'} text={t('Group_by_Type')} input={<ToggleSwitch onChange={handleChangeGroupByType} name='sidebarGroupByType' checked={sidebarGroupByType} />} />
				<SortListItem icon={'star'} text={t('Group_favorites')} input={<ToggleSwitch onChange={handleChangeShoFavorite} name='sidebarShowFavorites' checked={sidebarShowFavorites} />} />
				<SortListItem icon={'eye-off'} text={t('Unread_on_top')} input={<ToggleSwitch onChange={handleChangeShowUnread} name='sidebarShowUnread' checked={sidebarShowUnread} />} />
			</Margins>
		</ul>
	</>;
}
