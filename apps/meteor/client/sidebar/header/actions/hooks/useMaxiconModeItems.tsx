//TODO Maxicon
import {  ToggleSwitch } from '@rocket.chat/fuselage';
import { useEndpoint, useMethod, useSetModal, useUserPreference,} from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';
import { HideMaxiconModal } from './HideMaxiconModal';
import { ChatSubscription } from '../../../../../app/models/client/models/ChatSubscription';

import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';

export const useMaxiconModeItems = (): GenericMenuItemProps[] => {

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	

	const sidebarFindOnline = useUserPreference('sidebarFindOnline', false);
	const hideRomm = false;

	const handleChangeSidebarFindOnline = useCallback(
		() => saveUserPreferences({ data: { sidebarFindOnline: !sidebarFindOnline } }),
		[saveUserPreferences, sidebarFindOnline],
	);
	const setModal = useSetModal();
	const handleHideOneDayRoom = 		() => {
		const text: string = 'Tem certeza de que deseja Esconder as salas com mais de um dia?';
		setModal(<HideMaxiconModal onReset={(): Promise<void>  => onReset(true)} onCancel={(): void => setModal(null)} text={text} />);
		console.log('handleHideOneDayRoom')
	};
	const hideRoom = useMethod('hideRoom');

	const onReset = async (one:boolean): Promise<void> => {
		var query:any = {open: true};
		if(one){
			const data = new Date();
			data.setHours(0,0,0);
			query.ls ={$lt:data}
		}
		var subs = await ChatSubscription.find(query).fetch();
		for(var s of subs){
			var ee = await hideRoom( s.rid );

			console.log('hide '+ee+'  '+s.name, s.rid);
		}
		setModal(null);
	};

	const handleHideAllDayRoom = 		() => {
		const text: string = 'Tem certeza de que deseja Esconder todas as salas?';
		setModal(<HideMaxiconModal onReset={(): Promise<void>  => onReset(false)}  onCancel={(): void => setModal(null)} text={text} />);	
	};

	return [
		{
			id: 'sidebarFindOnline',
			content: 'Pesquisar somente Usuários online',
			icon: 'eye-off',
			addon: <ToggleSwitch onChange={handleChangeSidebarFindOnline} checked={sidebarFindOnline} />,
		},
		{
			id: 'hideOneDayRoom',
			content: 'Esconder salas 1 dia ',
			icon: 'trash',
			addon: <ToggleSwitch onChange={handleHideOneDayRoom} checked={hideRomm} />,
		},
		{
			id: 'hideAllDayRoom',
			content: 'Esconder Todas Salas',
			icon: 'trash',
			addon: <ToggleSwitch onChange={handleHideAllDayRoom} checked={hideRomm} />,
		},
	];
};
