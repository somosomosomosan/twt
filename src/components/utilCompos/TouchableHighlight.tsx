import { Box } from '@chakra-ui/react';

export default function TouchableHighlight(props: {
	children: React.ReactNode;
	baseBackgroundColor?: string;
	boxProps?: React.ComponentProps<typeof Box>;
}) {
	const bgRgb = convertColorCodeToRgb(props.baseBackgroundColor ?? '#FFFFFF');
	//aタグは上手くドラッグができない？なので不便。aタグを作らないようにdivのBoxでページ遷移はonclickのwindow.openで。
	return (
		<Box
			{...(props.boxProps ?? undefined)}
			backgroundColor={generateRgba(bgRgb, 1)}
			transition='all 0.2s cubic-bezier(.08,.52,.52,1)'
			_hover={{ backgroundColor: generateRgba(darkenRgbForHover(bgRgb), 1), cursor: 'pointer' }}
			_active={{
				backgroundColor: generateRgba(darkenRgbForActive(bgRgb), 1),
			}}
			//_focusWithin={{ backgroundColor: generateRgba(bgRgb, 1) }}
		>
			{props.children}
		</Box>
	);
	/*
		<Box
			{...(props.boxProps ?? undefined)}
			backgroundColor={generateRgba(bgRgb, 1)}
			transition='all 0.2s cubic-bezier(.08,.52,.52,1)'
			_hover={{ backgroundColor: 'rgba(247,249,249,1)', cursor: 'pointer' }}
			_active={{
				backgroundColor: 'rgba(237,242,244,1)',
			}}
			_focusWithin={{ backgroundColor: 'rgba(247,249,249,1)' }}
		>
			{props.children}
		</Box>
	);
	*/
	/*
	
			<Box
			{...(props.boxProps ?? undefined)}
			_hover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
			onClick={() => {
				window.location.href = 'https://twitter.com/sladrouv/status/1264857295470489601';
			}}
		>
			{props.children}
		</Box>

		<LinkBox as={'div'} {...(props.boxProps ?? undefined)} _hover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
			<LinkOverlay href={props.href}>{props.children}</LinkOverlay>
		</LinkBox>
		
				<LinkBox
			as={'a'}
			{...(props.boxProps ?? undefined)}
			_hover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
			href={props.href}
		>
			{props.children}
		</LinkBox>
		*/
}

/**
 * カラーコードをrgbに [red, green, blue]
 * https://lab.syncer.jp/Web/JavaScript/Snippet/61/
 * @param hex
 * @returns
 */
function convertColorCodeToRgb(hex: string): number[] {
	if (hex.slice(0, 1) === '#') hex = hex.slice(1);
	if (hex.length === 3)
		hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3);

	return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (str) {
		return parseInt(str, 16);
	});
}
function darkenRgbForHover(rgbArr: number[]) {
	return [
		(rgbArr[0] * (100 - 3.1372549019607843)) / 100,
		(rgbArr[1] * (100 - 2.3529411764705883)) / 100,
		(rgbArr[2] * (100 - 2.3529411764705883)) / 100,
	];
}
function darkenRgbForActive(rgbArr: number[]) {
	return [
		(rgbArr[0] * (100 - 7.0588235294117645)) / 100,
		(rgbArr[1] * (100 - 5.098039215686274)) / 100,
		(rgbArr[2] * (100 - 4.313725490196078)) / 100,
	];
}
function generateRgba(rgbArr: number[], alpha: number): string {
	return `rgba(${rgbArr.join(',')}, ${alpha})`;
}
