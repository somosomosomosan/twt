import {
	Alert,
	AlertIcon,
	Box,
	Button,
	Card,
	CardBody,
	Center,
	Container,
	Flex,
	Heading,
	Hide,
	IconButton,
	Link,
	ListItem,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Select,
	Stack,
	Text,
	Tooltip,
	UnorderedList,
	VStack,
	useColorMode,
	useDisclosure,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as Rb from 'rambda';
import { ChangeEvent, Suspense, useCallback, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaCheck, FaChevronDown, FaMoon, FaSun } from 'react-icons/fa';
import { MdOutlineTipsAndUpdates } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { COLOR_BORDER, COLOR_LINK } from '../../../components/TweetComponent/consts';
import { t_dbAuthor, t_dbTweetDataParsed, t_dbTweetScores } from '../../../components/TweetComponent/types';
import TweetComponentList from '../../../components/TweetList/TweetComponentList';
import { t_tweetViewStyleMode } from '../../../components/TweetList/TweetListItem';
import { t_blockedAccount } from '../../../components/TweetList/types';
import { READS_SAVE_DAYS, SITE_TITLE } from '../../../consts';
import { getRankingData2, getRankingHistories, t_rankingHistory } from '../../../utilfuncs/getRankingData';
import {
	loadBlockedAccountsFromStorage,
	loadReadsFromStorage,
	loadTweetViewStyleMode,
	saveReadsToStorage,
	saveTweetViewStyleMode,
} from '../../../utilfuncs/localStorages';
import { removeReadsNDaysBeforeThenSave, t_reads } from '../../../utilfuncs/reads';

const CATEGORY_NAME = 'smash';
export default function PageSmash() {
	const [searchParams, setSearchParams] = useSearchParams();
	const rankingFileName = searchParams.get('r');
	return (
		<div>
			<Helmet>
				<title>
					{SITE_TITLE.smash} | {SITE_TITLE.base}
				</title>
			</Helmet>
			{rankingFileName && <NotTheCurrentHistoryAlert categoryName={CATEGORY_NAME} />}
			<Container maxW='100%' centerContent marginTop={4} marginBottom={4}>
				<VStack spacing={4} align='stretch'>
					<Heading
						as='h1'
						size='lg'
						noOfLines={1}
						fontFamily={`Meiryo, "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif`}
					>
						{SITE_TITLE.base}: {SITE_TITLE.smash}
					</Heading>
					<Text size='sm'>スマブラアカウントの間で最近話題の投稿集</Text>
				</VStack>
			</Container>
			<Suspense fallback={<div>Loading...</div>}>
				<LoaderWrapper rankingFileName={rankingFileName} />
			</Suspense>
		</div>
	);
}
/*
				<>
					<Show above='sm'>
						<Box>This text appears at the "sm" value screen width or greater.</Box>
					</Show>
					<Hide below='md'>
						<Box>This text hides at the "md" value screen width and smaller.</Box>
					</Hide>
				</>
*/

export type t_storagedData = {
	tweetViewStyleMode: t_tweetViewStyleMode;
	chunkedScores: t_dbTweetScores[][];
	tweets: t_dbTweetDataParsed[];
	authors: t_dbAuthor[];
	blockedAccounts: t_blockedAccount[];
	readTweets: t_reads[];
};
function LoaderWrapper(props: { rankingFileName: string | undefined | null }) {
	const today = new Date();
	/*
	const { data } = useQuery({
		queryKey: [CATEGORY_NAME],
		queryFn: () => getRankingData(CATEGORY_NAME),
	});
	*/

	const { data: rankingHistories } = useQuery({
		queryKey: [`${CATEGORY_NAME}-histories`],
		queryFn: () => getRankingHistories(CATEGORY_NAME),
	});

	const rankingFileInfo = props.rankingFileName
		? rankingHistories?.find((e) => e.file_name === props.rankingFileName)
		: rankingHistories?.[0];
	const { data: rankingData } = useQuery({
		queryKey: [`${CATEGORY_NAME}-ranking`],
		queryFn: () => getRankingData2(CATEGORY_NAME, rankingFileInfo?.file_name ?? ''),
	});

	const blockedAccounts = loadBlockedAccountsFromStorage(CATEGORY_NAME);
	const tweetViewStyleMode = loadTweetViewStyleMode();

	return (
		<Content
			tweetViewStyleMode={tweetViewStyleMode}
			scores={rankingData?.scores ?? []}
			tweets={rankingData?.tweets ?? []}
			authors={rankingData?.authors ?? []}
			blockedAccounts={blockedAccounts}
			today={today}
			finishedScrapingDate={new Date(rankingFileInfo?.created_at ?? '')}
			rankingHistories={rankingHistories ?? []}
		/>
	);
}

function Content(
	props: Omit<t_storagedData, 'chunkedScores' | 'readTweets'> & {
		scores: t_dbTweetScores[];
		today: Date;
		finishedScrapingDate: Date;
		rankingHistories: t_rankingHistory[];
	},
) {
	const { state_collapseRead, state_reads, onChangeCollapseReadsMode } = useReads(props.today);
	/*
	おそらくinfinite scrollの方でstateを保持し続けてるためここで途中で変更しても変わらない
	ページ再読み込みさせるしか
	useEffect(() => {
		set_chunkedScores(chunkScore(props.scores, state_tweetViewStyleMode));
	}, [props.scores, state_tweetViewStyleMode]);
	*/

	return (
		<Box>
			<Container maxW='100%' centerContent marginBottom={4}>
				<VStack spacing={4}>
					<Box>
						<Text className='subText'>集計日時: {format(props.finishedScrapingDate, 'HH:mm · yyyy/MM/dd')}</Text>
						<Text className='subText' fontSize={'sm'}>
							1時間～1時間半毎に集計努力
						</Text>
					</Box>

					<RankingHistoriesSelector rankingHistories={props.rankingHistories} />

					<Hide below='lg'>
						<Box position={'absolute'} top={0} right={0}>
							<ColorSwitchButton />
						</Box>
						<OptionsForPc
							isCollapseRead={state_collapseRead}
							onChangeCollapseReadsMode={onChangeCollapseReadsMode}
							tweetViewStyleMode={props.tweetViewStyleMode}
							onChangeTweetViewStyleMode={(e) => {
								//set_tweetViewStyleMode(e);
								saveTweetViewStyleMode(e);
								window.location.reload();
							}}
						/>
					</Hide>
					<Hide above='lg'>
						<Box position={'absolute'} top={20} right={0}>
							<ColorSwitchButton />
						</Box>

						<OptionsForMobile
							isCollapseRead={state_collapseRead}
							onChangeCollapseReadsMode={onChangeCollapseReadsMode}
							tweetViewStyleMode={props.tweetViewStyleMode}
							onChangeTweetViewStyleMode={(e) => {
								//set_tweetViewStyleMode(e);
								saveTweetViewStyleMode(e);
								window.location.reload();
							}}
						/>
						<TipsForMobile />
					</Hide>
				</VStack>
			</Container>
			<Flex maxW='100%' flexDirection={'row'} justifyContent={'center'}>
				<Box
					//width:100%としないと画面幅がmaxWidthより小さい場合にmaxWidthまで拡大して画面幅を超えてしまう現象がおきることがある
					width={'100%'}
					maxW='598px'
					borderWidth={1}
					borderColor={COLOR_BORDER}
				>
					<Suspense fallback={<div>Loading...</div>}>
						<TweetComponentList
							{...props}
							chunkedScores={chunkScore(props.scores, props.tweetViewStyleMode)}
							tweetViewStyleMode={props.tweetViewStyleMode}
							categoryName={CATEGORY_NAME}
							collapseRead={state_collapseRead}
							today={props.today}
							readTweets={state_reads}
						/>
					</Suspense>
				</Box>
				<Hide below='lg'>
					<Box maxW={'312px'} minW={'300px'} alignItems={'start'}>
						<Box
						//position={'fixed'} maxW={'312px'} minW={'300px'} //固定化する場合はこれ
						>
							<VStack spacing={4}>
								<TipsForPc />
								<LinksForPc />
							</VStack>
							{/*
						<Link to={'/'}>ホーム</Link>
						<Text>AD!</Text>
						*/}
						</Box>
					</Box>
				</Hide>
			</Flex>
		</Box>
	);
}

function NotTheCurrentHistoryAlert(props: { categoryName: string }) {
	return (
		<Alert status='warning'>
			<AlertIcon />
			<Text>
				最新の集計結果があります。
				<Link color={COLOR_LINK} href={`./${props.categoryName}`}>
					表示する
				</Link>
			</Text>
		</Alert>
	);
}

function RankingHistoriesSelector(props: { rankingHistories: t_rankingHistory[] }) {
	const _getUrlWithoutQuery = () => {
		return window.location.href.substring(0, window.location.href.indexOf('?'));
	};
	const _handleChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
		const fileName = event.target.value;
		window.location.href = fileName === '' ? _getUrlWithoutQuery() : `?r=${fileName}`;
	}, []);
	return (
		<Select placeholder='過去の集計結果' onChange={_handleChange}>
			{props.rankingHistories.map((e, i) => (
				<option key={e.file_name} value={i === 0 ? '' : e.file_name}>
					{i === 0 ? `${e.file_name} (最新)` : e.file_name}
				</option>
			))}
		</Select>
	);
}
/*
function RankingHistoriesModal() {
	 const { isOpen, onOpen, onClose } = useDisclosure();
	return (
		<>
			
			<Modal onClose={props.onClose} isOpen={props.isOpen} isCentered>
				<ModalOverlay />
				<ModalContent>
					<ModalBody padding={0}>
						<DividedList itemProps={generateListItemsData({ ...props, onShowToast })} />
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	);
}*/

function ColorSwitchButton() {
	const { colorMode, toggleColorMode } = useColorMode();
	const tooltipLabel = colorMode === 'light' ? 'ダークモードへ切り替えます' : 'ライトモードへ切り替えます';
	return (
		<Tooltip label={tooltipLabel}>
			<IconButton
				aria-label='change theme'
				icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
				onClick={toggleColorMode}
			/>
		</Tooltip>
	);
}

function Tips(props: { isPc: boolean }) {
	return (
		<UnorderedList spacing={3}>
			{TIPS_TEXT.map((e, i) => (
				<ListItem key={i}>{props.isPc ? e.pc : e.mobile}</ListItem>
			))}
		</UnorderedList>
	);
}

const TIPS_TEXT_CLICK_POST_PC = '投稿をクリックするといろいろできます。';
const TIPS_TEXT_CLICK_POST_MOBILE = '投稿をタップするといろいろできます。';
const TIP_TEXT_ABOUT_READS_PC =
	'「既読を非表示」にすると、最近表示した投稿が非表示になります。※作動しない場合は一旦リロードしてみてください。';
const TIP_TEXT_ABOUT_READS_MOBILE =
	'「表示設定」→「既読を非表示」で、最近表示した投稿が非表示になります。※作動しない場合は一旦リロードしてみてください。';
const TIPS_TEXT_NOIMAGE_PC = '通信量が気になる方は、「投稿表示設定」→「画像無し」をどうぞ。';
const TIPS_TEXT_NOIMAGE_MOBILE = '通信量が気になる方は、「表示設定」→「画像無し」をどうぞ。';
const TIPS_TEXT_MOTIVATION = 'データ収集精度はこれから徐々に良くなっていきます。';

const TIPS_TEXT = [
	{ pc: TIPS_TEXT_CLICK_POST_PC, mobile: TIPS_TEXT_CLICK_POST_MOBILE },
	{
		pc: TIP_TEXT_ABOUT_READS_PC,
		mobile: TIP_TEXT_ABOUT_READS_MOBILE,
	},
	{
		pc: TIPS_TEXT_NOIMAGE_PC,
		mobile: TIPS_TEXT_NOIMAGE_MOBILE,
	},
	{
		pc: TIPS_TEXT_MOTIVATION,
		mobile: TIPS_TEXT_MOTIVATION,
	},
];

function TipsForPc() {
	return (
		<Card textAlign={'left'} marginLeft={'24px'} width={'100%'} variant={'outline'}>
			<CardBody>
				<VStack spacing={2}>
					<Center>
						<MdOutlineTipsAndUpdates size={32} />
					</Center>
					<Tips isPc={true} />
				</VStack>
			</CardBody>
		</Card>
	);
}

function LinksForPc() {
	return (
		<Card textAlign={'left'} marginLeft={'24px'} width={'100%'} variant={'outline'}>
			<CardBody>
				<Link fontSize={12} href={'https://somosomosomosan.github.io/texttoimage/'} isExternal>
					文章画像化ツール
				</Link>
			</CardBody>
		</Card>
	);
}

function TipsForMobile() {
	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<Box>
			<Button leftIcon={<MdOutlineTipsAndUpdates />} variant='outline' colorScheme='yellow' size='xs' onClick={onOpen}>
				Tips
			</Button>
			<Modal onClose={onClose} isOpen={isOpen} isCentered>
				<ModalOverlay />
				<ModalContent onClick={onClose}>
					<ModalHeader>Tips</ModalHeader>
					<ModalBody>
						<Tips isPc={false} />
					</ModalBody>
				</ModalContent>
			</Modal>
		</Box>
	);
}

function OptionsForPc(props: {
	isCollapseRead: boolean;
	onChangeCollapseReadsMode: () => any;
	tweetViewStyleMode: t_tweetViewStyleMode;
	onChangeTweetViewStyleMode: (e: t_tweetViewStyleMode) => any;
}) {
	return (
		<Flex flexDirection={'column'}>
			<Stack spacing={4} direction='row' justifyContent='center' marginBottom={4}>
				<Menu>
					<MenuButton as={Button} colorScheme='teal' size={'lg'} variant='outline'>
						投稿表示設定
					</MenuButton>
					<MenuList>
						<MenuItem
							onClick={() => props.onChangeTweetViewStyleMode('CUSTOM')}
							icon={props.tweetViewStyleMode === 'CUSTOM' ? <FaCheck /> : undefined}
						>
							軽量表示
						</MenuItem>
						<MenuItem
							onClick={() => props.onChangeTweetViewStyleMode('NO_MEDIAS')}
							icon={props.tweetViewStyleMode === 'NO_MEDIAS' ? <FaCheck /> : undefined}
						>
							画像無し
						</MenuItem>
						<MenuItem
							onClick={() => props.onChangeTweetViewStyleMode('EMBED')}
							icon={props.tweetViewStyleMode === 'EMBED' ? <FaCheck /> : undefined}
						>
							埋め込み表示
						</MenuItem>
					</MenuList>
				</Menu>
				<Button variant='outline' colorScheme='teal' size='lg' onClick={props.onChangeCollapseReadsMode}>
					{props.isCollapseRead ? '既読を表示' : '既読を非表示'}
				</Button>
				{/*
				<Button variant='outline' colorScheme='teal' size='lg'>
					非表示アカウント設定
				</Button>
				*/}
			</Stack>
			<Stack spacing={4} direction='row' justifyContent='center'></Stack>
		</Flex>
	);
}

function OptionsForMobile(props: {
	isCollapseRead: boolean;
	onChangeCollapseReadsMode: () => any;
	tweetViewStyleMode: t_tweetViewStyleMode;
	onChangeTweetViewStyleMode: (e: t_tweetViewStyleMode) => any;
}) {
	return (
		<Menu>
			<MenuButton as={Button} colorScheme='teal' size={'lg'} variant='outline' rightIcon={<FaChevronDown />}>
				表示設定
			</MenuButton>

			<MenuList>
				<MenuItem
					onClick={() => props.onChangeTweetViewStyleMode('CUSTOM')}
					icon={props.tweetViewStyleMode === 'CUSTOM' ? <FaCheck /> : undefined}
				>
					軽量表示
				</MenuItem>
				<MenuItem
					onClick={() => props.onChangeTweetViewStyleMode('NO_MEDIAS')}
					icon={props.tweetViewStyleMode === 'NO_MEDIAS' ? <FaCheck /> : undefined}
				>
					画像無し
				</MenuItem>
				<MenuItem
					onClick={() => props.onChangeTweetViewStyleMode('EMBED')}
					icon={props.tweetViewStyleMode === 'EMBED' ? <FaCheck /> : undefined}
				>
					埋め込み表示
				</MenuItem>
				<MenuItem onClick={props.onChangeCollapseReadsMode}>
					{props.isCollapseRead ? '既読を表示' : '既読を非表示'}
				</MenuItem>
				{/*
				<MenuItem as='a' href='#'>
					非表示アカウント設定
				</MenuItem>
				*/}
			</MenuList>
		</Menu>
	);
}

function useReads(today: Date) {
	const [state_collapseRead, set_collapseRead] = useState<boolean>(false);
	const [state_reads, set_reads] = useState<t_reads[]>(setupReads(CATEGORY_NAME, today));
	const onChangeCollapseReadsMode = useCallback(() => {
		set_collapseRead(!state_collapseRead);
		if (state_collapseRead) {
			return;
		}
		set_reads(setupReads(CATEGORY_NAME, today));
	}, [state_collapseRead, today]);

	return {
		state_collapseRead,
		state_reads,
		onChangeCollapseReadsMode,
	};
}

function chunkScore(scores: t_dbTweetScores[], tweetViewStyleMode: t_tweetViewStyleMode) {
	if (tweetViewStyleMode === 'EMBED') {
		return Rb.splitEvery(3, scores);
	}
	return Rb.splitEvery(5, scores);
}

function setupReads(categoryName: string, today: Date) {
	const savedReads = loadReadsFromStorage(categoryName);
	//今日からREADS_SAVE_DAYSより前のreads履歴は削除する。
	const savedReadsRemovedTooOlds = removeReadsNDaysBeforeThenSave(savedReads, today, READS_SAVE_DAYS);
	saveReadsToStorage(categoryName, savedReadsRemovedTooOlds);
	return savedReadsRemovedTooOlds;
}
