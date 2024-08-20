import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import GenericModal from '/client/components/GenericModal';

//import GenericModal from '../../../../client/components/GenericModal';

type HideMaxiconModalProps = {
	onReset: () => Promise<void>;
	onCancel: () => void;
	text: any;
};

export const HideMaxiconModal = ({ onCancel, onReset, text }: HideMaxiconModalProps): ReactElement => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='danger'
			title='Esconder salas'
			onConfirm={onReset}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Reset')}
		>
			{text}
		</GenericModal>
	);
};

