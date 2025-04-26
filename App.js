import { Linking } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { WebView } from 'react-native-webview';

const API_KEY = '5e165254d12e40e79677d025e5651712';
const CATEGORIES = ['General', 'Business', 'Entertainment', 'Health', 'Science', 'Sports', 'Technology'];

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('General');
  const [page, setPage] = useState(1);
  const [likedArticles, setLikedArticles] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedArticleUrl, setSelectedArticleUrl] = useState(null); // Новый state для выбранной статьи
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchNews();
  }, [category, page]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category.toLowerCase()}&page=${page}&pageSize=10&apiKey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      setNews(page === 1 ? data.articles : [...news, ...data.articles]);
      setLoading(false);
      fadeIn();
    } catch (error) {
      console.error('Ошибка при загрузке новостей:', error);
      setLoading(false);
    }
  };

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handleCategoryPress = (cat) => {
    setCategory(cat);
    setPage(1);
    setNews([]);
  };

  const toggleLike = (article) => {
    if (likedArticles.includes(article.url)) {
      setLikedArticles(likedArticles.filter((url) => url !== article.url));
    } else {
      setLikedArticles([...likedArticles, article.url]);
    }
  };

  const filterByDate = (articles) => {
    const filteredArticles = articles.filter((article) => {
      if (dateFilter === '24h') {
        const articleDate = new Date(article.publishedAt);
        return articleDate > Date.now() - 24 * 60 * 60 * 1000; // Только последние 24 часа
      }
      return true;
    });
    return filteredArticles;
  };

  const filteredNews = filterByDate(
    news.filter((item) => item.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setSelectedArticleUrl(item.url)} // Открытие WebView с URL статьи
    >
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {item.urlToImage && <Image source={{ uri: item.urlToImage }} style={styles.image} />}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
          <TouchableOpacity onPress={() => toggleLike(item)}>
            <Text style={styles.likeButton}>
              {likedArticles.includes(item.url) ? 'Убрать лайк' : 'Лайк'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderCategory = (cat) => {
    const iconMap = {
      General: 'newspaper-o',
      Business: 'briefcase',
      Entertainment: 'film',
      Health: 'heartbeat',
      Science: 'flask',
      Sports: 'soccer-ball-o',
      Technology: 'cogs',
    };

    return (
      <TouchableOpacity
        key={cat}
        style={[styles.categoryButton, category === cat && styles.activeCategory]}
        onPress={() => handleCategoryPress(cat)}
      >
        <Icon name={iconMap[cat]} size={20} color={category === cat ? '#fff' : '#424242'} />
        <Text style={[styles.categoryText, category === cat && { color: '#fff' }]}>{cat}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {selectedArticleUrl ? (
        // Если выбрана статья, открываем WebView внутри приложения
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: selectedArticleUrl }}
            style={{ flex: 1 }}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedArticleUrl(null)} // Закрытие WebView
          >
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Новости</Text>
          </View>

          <View style={styles.container}>
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск новостей..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {CATEGORIES.map((cat) => renderCategory(cat))}
            </ScrollView>

            <View style={styles.dateFilterContainer}>
              <TouchableOpacity onPress={() => setDateFilter('all')}>
                <Text style={styles.dateFilterText}>Все</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDateFilter('24h')}>
                <Text style={styles.dateFilterText}>24 часа</Text>
              </TouchableOpacity>
            </View>

            {loading && page === 1 ? (
              <ActivityIndicator size="large" color="#5C6BC0" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredNews}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.url + index}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingVertical: 15,
    backgroundColor: 'transparent',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCategory: {
    backgroundColor: '#5C6BC0',
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#424242',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#616161',
  },
  likeButton: {
    fontSize: 14,
    color: '#5C6BC0',
    marginTop: 10,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  dateFilterText: {
    fontSize: 14,
    color: '#5C6BC0',
    marginRight: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#5C6BC0',
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
